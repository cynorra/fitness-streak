import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from './supabase';

export type Picked = { uri: string; name: string; mime: string; size: number; kind: 'image' | 'file' };

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const extOf = (mime: string) => (mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg');

/** Photo from the library (meal photos, diploma scans). Returns null when cancelled / permission denied. */
export async function pickImage(): Promise<Picked | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  const mime = a.mimeType && ALLOWED.includes(a.mimeType) ? a.mimeType : 'image/jpeg';
  return { uri: a.uri, name: a.fileName || `photo.${extOf(mime)}`, mime, size: a.fileSize || 0, kind: 'image' };
}

/** PDF / image document. */
export async function pickDocument(): Promise<Picked | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ALLOWED, copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  const mime = a.mimeType && ALLOWED.includes(a.mimeType) ? a.mimeType : 'application/pdf';
  return { uri: a.uri, name: a.name, mime, size: a.size || 0, kind: mime === 'application/pdf' ? 'file' : 'image' };
}

/** Uploads to a PRIVATE bucket at <folder>/<random>.<ext>; returns the storage path. */
export async function uploadPrivate(bucket: 'diplomas' | 'chat-files', folder: string, f: Picked): Promise<string> {
  if (f.size > MAX_BYTES) throw new Error('File is larger than 10 MB');
  const buf = await (await fetch(f.uri)).arrayBuffer();
  if (buf.byteLength > MAX_BYTES) throw new Error('File is larger than 10 MB');
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extOf(f.mime)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, buf, { contentType: f.mime, upsert: false });
  if (error) throw error;
  return path;
}

export async function signedUrl(bucket: 'diplomas' | 'chat-files', path: string): Promise<string | null> {
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

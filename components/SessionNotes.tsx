import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, FlatList, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { format, parseISO } from 'date-fns';

type SessionNotesProps = {
  visible: boolean;
  onClose: () => void;
  appointmentId: string;
  clientId: string;
  clientName: string;
};

export default function SessionNotes({ visible, onClose, appointmentId, clientId, clientName }: SessionNotesProps) {
  const { profile } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadNotes = async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNotes(data);
    }
  };

  useEffect(() => {
    if (visible) {
      loadNotes();
    }
  }, [visible, appointmentId]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !profile) return;
    
    setLoading(true);
    const { error } = await supabase.from('session_notes').insert({
      dietitian_id: profile.id,
      client_id: clientId,
      appointment_id: appointmentId,
      note: newNote,
      is_private: isPrivate,
    });

    if (!error) {
      setNewNote('');
      setIsPrivate(false);
      await loadNotes();
    } else {
      alert('Not eklenirken hata oluştu.');
    }
    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{clientName} - Seans Notları</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Kapat</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Henüz not eklenmemiş.</Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.noteCard, item.is_private && styles.noteCardPrivate]}>
              <View style={styles.noteHeader}>
                <Text style={styles.noteDate}>{format(parseISO(item.created_at), 'dd MMM yyyy HH:mm')}</Text>
                {item.is_private && <Text style={styles.privateBadge}>Sadece Sen</Text>}
              </View>
              <Text style={styles.noteContent}>{item.note}</Text>
            </View>
          )}
        />

        {profile?.role === 'dietitian' && (
          <View style={styles.inputSection}>
            <TextInput
              style={styles.input}
              placeholder="Yeni not ekle..."
              placeholderTextColor="#666"
              value={newNote}
              onChangeText={setNewNote}
              multiline
            />
            
            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.toggleBtn}
                onPress={() => setIsPrivate(!isPrivate)}
              >
                <Text style={styles.toggleText}>
                  {isPrivate ? '🔒 Sadece Ben Göreyim' : '👁️ Danışan da Görsün'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                onPress={handleAddNote}
                disabled={loading}
              >
                <Text style={styles.saveText}>{loading ? '...' : 'Ekle'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  title: { color: '#fff', fontSize: 16, fontWeight: '900' },
  closeBtn: { padding: 8 },
  closeText: { color: '#10b981', fontSize: 14, fontWeight: '800' },
  list: { padding: 20, flexGrow: 1 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 40 },
  noteCard: { backgroundColor: '#111', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  noteCardPrivate: { borderColor: '#f59e0b', backgroundColor: '#1a140a' },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  noteDate: { color: '#888', fontSize: 10, fontWeight: '800' },
  privateBadge: { color: '#f59e0b', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  noteContent: { color: '#fff', fontSize: 14, lineHeight: 22 },
  inputSection: { padding: 20, borderTopWidth: 1, borderTopColor: '#222', backgroundColor: '#0a0a0a', paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  input: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 16, color: '#fff', minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleBtn: { padding: 8 },
  toggleText: { color: '#888', fontSize: 12, fontWeight: '800' },
  saveBtn: { backgroundColor: '#10b981', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { color: '#fff', fontWeight: '900' },
});

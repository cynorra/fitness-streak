// Video visits use a public Jitsi Meet room. No account, no payment, nothing is recorded by the app.
// PRIVACY LIMIT: meet.jit.si is a third-party public service; anyone holding the room link can join. The room name is an
// unguessable random string created server-side per appointment, and must only be shared inside the app.
// Do not discuss anything you would not accept travelling over a third-party video service.
export const JITSI_BASE = 'https://meet.jit.si';

export function jitsiUrl(room: string | null | undefined): string | null {
  if (!room || !/^[A-Za-z0-9-]{8,80}$/.test(room)) return null;
  return `${JITSI_BASE}/${room}`;
}

/** A visit can be joined from 10 minutes before until 90 minutes after the start. */
export function canJoinNow(startIso: string, now = new Date()): boolean {
  const s = new Date(startIso).getTime();
  return now.getTime() >= s - 10 * 60_000 && now.getTime() <= s + 90 * 60_000;
}

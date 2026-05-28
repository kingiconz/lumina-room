import { useState } from "react";
import { addBooking, getBookings } from "@/lib/store";
import type { Room } from "@/lib/rooms";

function toLocalInputValue(d: Date) {
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

export function BookingDialog({ room, onClose }: { room: Room; onClose: () => void }) {
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 60000);
  const in90 = new Date(now.getTime() + 90 * 60000);

  const [start, setStart] = useState(toLocalInputValue(in30));
  const [end, setEnd] = useState(toLocalInputValue(in90));
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !organizer.trim()) {
      setError("Please complete all fields.");
      return;
    }
    const s = new Date(start);
    const en = new Date(end);
    if (en <= s) {
      setError("End time must be after start time.");
      return;
    }
    const conflict = getBookings().some(
      (b) => b.roomCode === room.code && +new Date(b.start) < +en && +new Date(b.end) > +s,
    );
    if (conflict) {
      setError("This slot conflicts with an existing booking.");
      return;
    }
    addBooking({
      roomCode: room.code,
      title: title.trim(),
      organizer: organizer.trim(),
      start: s.toISOString(),
      end: en.toISOString(),
    });
    setSuccess(true);
    setTimeout(onClose, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-up">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-elegant">
        <div className="bg-gradient-primary p-6 text-primary-foreground">
          <div className="text-xs uppercase tracking-widest opacity-80">{room.floor}</div>
          <h2 className="mt-1 text-2xl font-semibold">{room.name}</h2>
          <div className="mt-1 text-sm opacity-90">Capacity {room.capacity} · {room.amenities.join(" · ")}</div>
        </div>
        {success ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-xl">Booking confirmed</h3>
            <p className="mt-1 text-sm text-muted-foreground">Your meeting is on the schedule.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Start</span>
                <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">End</span>
                <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Meeting Title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Quarterly Strategy Review"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Organizer Name</span>
              <input value={organizer} onChange={(e) => setOrganizer(e.target.value)} maxLength={80} placeholder="Your full name"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </label>
            {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-muted">
                Cancel
              </button>
              <button type="submit"
                className="rounded-lg bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-smooth hover:shadow-elegant">
                Confirm Booking
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

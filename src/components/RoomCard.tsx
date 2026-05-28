import type { Room } from "@/lib/rooms";
import { formatTime, getRoomStatus, useBookings, useNow } from "@/lib/store";
import { StatusBadge } from "./StatusBadge";

export function RoomCard({ room, onBook }: { room: Room; onBook: (r: Room) => void }) {
  const bookings = useBookings();
  const now = useNow(15000);
  const { status, current, next } = getRoomStatus(room.code, bookings, now);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-elegant">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-primary opacity-[0.06] transition-smooth group-hover:opacity-[0.12]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{room.floor}</div>
            <h3 className="mt-1 text-2xl font-semibold leading-tight">{room.name}</h3>
          </div>
          <StatusBadge status={status} />
        </div>

        <button
          onClick={() => onBook(room)}
          className="mt-8 w-full rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-smooth hover:shadow-elegant"
        >
          Book this room
        </button>
      </div>
    </div>
  );
}

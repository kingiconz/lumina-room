import { createFileRoute, Link } from "@tanstack/react-router";
import { getRoom } from "@/lib/rooms";
import { formatCountdown, formatTime, getRoomStatus, useBookings, useNow } from "@/lib/store";

export const Route = createFileRoute("/panel/$roomCode")({
  component: Panel,
});

function Panel() {
  const { roomCode } = Route.useParams();
  const room = getRoom(roomCode);
  const bookings = useBookings();
  const now = useNow(1000);

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-hero text-primary-foreground">
        <div className="text-center">
          <div className="text-sm uppercase tracking-widest opacity-80">Unknown Room</div>
          <div className="mt-2 text-3xl">No room found for code "{roomCode}"</div>
          <Link to="/" className="mt-6 inline-block rounded-full bg-white/10 px-5 py-2 backdrop-blur">Go home</Link>
        </div>
      </div>
    );
  }

  const { status, current, next } = getRoomStatus(room.code, bookings, now);
  const bg = status === "available" ? "bg-panel-available" : status === "occupied" ? "bg-panel-occupied" : "bg-panel-soon";
  const stateText = status === "available" ? "AVAILABLE" : status === "occupied" ? "MEETING IN SESSION" : "RESERVED SOON";

  const countdownTarget = current ? new Date(current.end) : next ? new Date(next.start) : null;
  const countdownLabel = current ? "Ends in" : next ? "Starts in" : null;

  return (
    <div className={`relative flex min-h-screen flex-col overflow-hidden text-white ${bg}`}>
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_15%_20%,white_0,transparent_45%),radial-gradient(circle_at_85%_75%,white_0,transparent_45%)]" />

      {/* Top bar */}
      <div className="relative flex items-center justify-between px-12 py-8">
        <div>
          <div className="text-sm uppercase tracking-[0.3em] opacity-80">{room.floor}</div>
          <div className="mt-1 text-5xl font-semibold tracking-tight">{room.name}</div>
        </div>
        <div className="text-right">
          <div className="text-5xl font-semibold tabular-nums">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          <div className="mt-1 text-sm uppercase tracking-widest opacity-80">{now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
        </div>
      </div>

      {/* Centerpiece */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-12 text-center">
        <div className="mb-8 inline-flex items-center gap-3 rounded-full bg-white/15 px-6 py-2 text-sm uppercase tracking-[0.4em] backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          Status
        </div>
        <h1 className="text-[clamp(4rem,12vw,11rem)] font-semibold leading-none tracking-tight drop-shadow-lg">
          {stateText}
        </h1>

        {current && (
          <div className="mt-10 max-w-3xl">
            <div className="text-2xl opacity-90">In session</div>
            <div className="mt-2 text-5xl font-semibold">{current.title}</div>
            <div className="mt-2 text-xl opacity-85">{formatTime(current.start)} — {formatTime(current.end)} · {current.organizer}</div>
          </div>
        )}

        {!current && next && (
          <div className="mt-10 max-w-3xl">
            <div className="text-2xl opacity-90">Next meeting</div>
            <div className="mt-2 text-5xl font-semibold">{next.title}</div>
            <div className="mt-2 text-xl opacity-85">{formatTime(next.start)} — {formatTime(next.end)} · {next.organizer}</div>
          </div>
        )}

        {!current && !next && (
          <div className="mt-10 text-2xl opacity-85">No meetings scheduled — the room is free to use.</div>
        )}

        {countdownTarget && countdownLabel && (
          <div className="mt-12 inline-flex flex-col items-center rounded-3xl bg-white/15 px-12 py-6 backdrop-blur">
            <div className="text-sm uppercase tracking-widest opacity-80">{countdownLabel}</div>
            <div className="mt-1 text-7xl font-semibold tabular-nums">{formatCountdown(countdownTarget, now)}</div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="relative flex items-center justify-between px-12 py-6 text-sm opacity-90">
        <div>Capacity {room.capacity} · {room.amenities.join(" · ")}</div>
        <div className="uppercase tracking-widest">Atrium · Room Panel</div>
      </div>
    </div>
  );
}

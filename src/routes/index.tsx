import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ROOMS, FLOORS, type Room } from "@/lib/rooms";
import { formatTime, getRoomStatus, useBookings, useNow } from "@/lib/store";
import { RoomCard } from "@/components/RoomCard";
import { BookingDialog } from "@/components/BookingDialog";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atrium — Smart Meeting Room Management" },
      { name: "description", content: "Real-time meeting room availability, booking and scheduling for modern enterprises." },
      { property: "og:title", content: "Atrium — Smart Meeting Room Management" },
      { property: "og:description", content: "Real-time meeting room availability, booking and scheduling for modern enterprises." },
    ],
  }),
  component: Home,
});

function Home() {
  const bookings = useBookings();
  const now = useNow(30000);
  const [floor, setFloor] = useState<string>("All");
  const [q, setQ] = useState("");
  const [booking, setBooking] = useState<Room | null>(null);

  const stats = useMemo(() => {
    let available = 0, soon = 0, occupied = 0;
    for (const r of ROOMS) {
      const s = getRoomStatus(r.code, bookings, now).status;
      if (s === "available") available++; else if (s === "soon") soon++; else occupied++;
    }
    return { available, soon, occupied };
  }, [bookings, now]);

  const filtered = useMemo(() => {
    return ROOMS.filter((r) => (floor === "All" || r.floor === floor) && (q.trim() === "" || r.name.toLowerCase().includes(q.toLowerCase())));
  }, [floor, q]);

  const todayBookings = useMemo(() => {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
    return bookings
      .filter((b) => +new Date(b.start) >= +startOfDay && +new Date(b.start) <= +endOfDay)
      .sort((a, b) => +new Date(a.start) - +new Date(b.start));
  }, [bookings]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_60%,white_0,transparent_35%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 text-primary-foreground md:py-28">
          <div className="max-w-2xl animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Real-time workspace intelligence
            </span>
            <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
              Find a room.<br />Book it in seconds.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/85">
              Live availability across every floor, with elegant booking flows designed for the way modern teams meet.
            </p>
            <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
              <Stat label="Available" value={stats.available} dot="bg-success" />
              <Stat label="Reserved Soon" value={stats.soon} dot="bg-warning" />
              <Stat label="Occupied" value={stats.occupied} dot="bg-destructive" />
            </div>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section id="rooms" className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Meeting Rooms</h2>
            <p className="mt-1 text-muted-foreground">Browse, filter and book any space across the building.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search rooms…"
                className="w-full rounded-xl border bg-card py-2.5 pl-9 pr-3 text-sm shadow-soft outline-none transition-smooth focus:ring-2 focus:ring-ring sm:w-72" />
            </div>
            <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-1 shadow-soft">
              {["All", ...FLOORS].map((f) => (
                <button key={f} onClick={() => setFloor(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-smooth ${
                    floor === f ? "bg-gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                  }`}>{f}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <div key={r.code} className="animate-fade-up">
              <RoomCard room={r} onBook={setBooking} />
            </div>
          ))}
        </div>
      </section>

      {/* Schedule */}
      <section id="schedule" className="mx-auto max-w-7xl px-6 pb-20">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b bg-gradient-to-r from-secondary/60 to-card px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold">Today's Schedule</h2>
              <p className="text-sm text-muted-foreground">All meetings happening today, across every room.</p>
            </div>
            <div className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
          </div>
          {todayBookings.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">No meetings scheduled for today.</div>
          ) : (
            <ul className="divide-y">
              {todayBookings.map((b) => {
                const room = ROOMS.find((r) => r.code === b.roomCode);
                return (
                  <li key={b.id} className="grid grid-cols-12 gap-4 px-6 py-4 transition-smooth hover:bg-muted/40">
                    <div className="col-span-3 text-sm font-medium">{formatTime(b.start)} — {formatTime(b.end)}</div>
                    <div className="col-span-5">
                      <div className="font-medium">{b.title}</div>
                      <div className="text-sm text-muted-foreground">by {b.organizer}</div>
                    </div>
                    <div className="col-span-4 text-right text-sm">
                      <div className="font-medium">{room?.name}</div>
                      <div className="text-muted-foreground">{room?.floor}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <footer id="about" className="border-t bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} Atrium · Workspace Intelligence</div>
          <div className="opacity-70">Crafted for the smart office.</div>
        </div>
      </footer>

      {booking && <BookingDialog room={booking} onClose={() => setBooking(null)} />}
    </div>
  );
}

function Stat({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/80">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
      </div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
    </div>
  );
}

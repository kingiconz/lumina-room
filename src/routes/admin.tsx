import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ROOMS, getRoom } from "@/lib/rooms";
import {
  assignDevice, formatTime, getRoomStatus, isAdmin, loginAdmin, logoutAdmin,
  removeBooking, removeDevice, useBookings, useDevices, useIsAdmin, useNow,
} from "@/lib/store";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const admin = useIsAdmin();
  if (!admin) return <Login />;
  return <Dashboard />;
}

function Login() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginAdmin(u.trim(), p)) setErr("Invalid credentials. Try admin / admin.");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-hero p-6 text-primary-foreground">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_70%,white_0,transparent_40%)]" />
      <form onSubmit={submit} className="relative w-full max-w-md glass-dark rounded-3xl p-8 shadow-elegant">
        <div className="mb-6 text-center">
          <div className="text-xs uppercase tracking-[0.4em] opacity-80">Restricted</div>
          <h1 className="mt-2 text-3xl font-semibold">Administrator Sign In</h1>
          <p className="mt-2 text-sm text-white/80">Manage rooms, devices and bookings.</p>
        </div>
        <label className="block">
          <span className="text-xs uppercase tracking-wide opacity-80">Username</span>
          <input value={u} onChange={(e) => setU(e.target.value)} autoFocus
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-white/50" />
        </label>
        <label className="mt-4 block">
          <span className="text-xs uppercase tracking-wide opacity-80">Password</span>
          <input type="password" value={p} onChange={(e) => setP(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-white/50" />
        </label>
        {err && <div className="mt-3 rounded-lg bg-destructive/30 px-3 py-2 text-sm">{err}</div>}
        <button className="mt-6 w-full rounded-xl bg-white px-4 py-2.5 font-semibold text-primary shadow-soft transition-smooth hover:shadow-elegant">
          Sign In
        </button>
        <div className="mt-4 text-center text-xs opacity-70">Hint: admin / admin</div>
      </form>
    </div>
  );
}

function Dashboard() {
  const bookings = useBookings();
  const devices = useDevices();
  const now = useNow(15000);
  const [tab, setTab] = useState<"overview" | "devices" | "bookings" | "rooms">("overview");

  const activeMeetings = useMemo(
    () => bookings.filter((b) => +new Date(b.start) <= +now && +new Date(b.end) > +now),
    [bookings, now],
  );
  const onlineDevices = devices.filter((d) => +now - +new Date(d.lastSeen) < 30_000);
  const unassigned = devices.filter((d) => !d.roomCode);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">A</div>
            <div>
              <div className="text-base font-semibold">Atrium Admin</div>
              <div className="-mt-0.5 text-xs text-muted-foreground">Workspace control center</div>
            </div>
          </div>
          <button onClick={() => logoutAdmin()} className="rounded-lg border px-3 py-1.5 text-sm transition-smooth hover:bg-muted">Sign out</button>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 px-6">
          {[
            ["overview", "Overview"], ["devices", "Devices"], ["bookings", "Bookings"], ["rooms", "Rooms"],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k as typeof tab)}
              className={`relative px-4 py-3 text-sm font-medium transition-smooth ${tab === k ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {l}
              {tab === k && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-gradient-primary" />}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Widget label="Total Rooms" value={ROOMS.length} sub="Across 4 floors" />
              <Widget label="Active Meetings" value={activeMeetings.length} sub={`${bookings.length} booked total`} accent />
              <Widget label="Online Devices" value={onlineDevices.length} sub={`${devices.length} registered`} />
              <Widget label="Pending Assignments" value={unassigned.length} sub="Tablets awaiting room" warn={unassigned.length > 0} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Live room activity">
                <div className="divide-y">
                  {ROOMS.map((r) => {
                    const s = getRoomStatus(r.code, bookings, now);
                    return (
                      <div key={r.code} className="flex items-center justify-between py-3">
                        <div>
                          <div className="font-medium">{r.name}</div>
                          <div className="text-xs text-muted-foreground">{r.floor}</div>
                        </div>
                        <div className="text-right text-sm">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            s.status === "available" ? "bg-success/10 text-success" :
                            s.status === "occupied" ? "bg-destructive/10 text-destructive" : "bg-warning/20 text-warning-foreground"
                          }`}>
                            {s.status === "available" ? "Available" : s.status === "occupied" ? "In session" : "Reserved soon"}
                          </span>
                          {s.current && <div className="mt-1 text-xs text-muted-foreground">until {formatTime(s.current.end)}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
              <Panel title="Upcoming meetings">
                <div className="divide-y">
                  {bookings
                    .filter((b) => +new Date(b.end) > +now)
                    .sort((a, b) => +new Date(a.start) - +new Date(b.start))
                    .slice(0, 6)
                    .map((b) => (
                      <div key={b.id} className="flex items-center justify-between py-3 text-sm">
                        <div>
                          <div className="font-medium">{b.title}</div>
                          <div className="text-xs text-muted-foreground">{getRoom(b.roomCode)?.name} · {b.organizer}</div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {formatTime(b.start)} — {formatTime(b.end)}
                        </div>
                      </div>
                    ))}
                  {bookings.filter((b) => +new Date(b.end) > +now).length === 0 && (
                    <div className="py-6 text-center text-sm text-muted-foreground">No upcoming meetings.</div>
                  )}
                </div>
              </Panel>
            </div>
          </div>
        )}

        {tab === "devices" && (
          <Panel title="Devices">
            {devices.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No devices registered yet. Visit <code className="rounded bg-muted px-1.5 py-0.5">/setup</code> on a tablet to provision one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr><th className="py-2">Device ID</th><th>Status</th><th>Assigned Room</th><th>Last Seen</th><th className="text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {devices.map((d) => {
                      const online = +now - +new Date(d.lastSeen) < 30_000;
                      return (
                        <tr key={d.id}>
                          <td className="py-3 font-mono">{d.id}</td>
                          <td>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${online ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-success" : "bg-muted-foreground"}`} />
                              {online ? "Online" : "Offline"}
                            </span>
                          </td>
                          <td>
                            <select value={d.roomCode ?? ""} onChange={(e) => assignDevice(d.id, e.target.value || null)}
                              className="rounded-lg border bg-background px-2 py-1 text-sm">
                              <option value="">— Unassigned —</option>
                              {ROOMS.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
                            </select>
                          </td>
                          <td className="text-muted-foreground">{formatTime(d.lastSeen)}</td>
                          <td className="text-right">
                            <button onClick={() => removeDevice(d.id)} className="rounded-md px-2 py-1 text-xs text-destructive hover:bg-destructive/10">Remove</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )}

        {tab === "bookings" && (
          <Panel title="Bookings">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="py-2">When</th><th>Room</th><th>Meeting</th><th>Organizer</th><th className="text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y">
                  {bookings.sort((a, b) => +new Date(a.start) - +new Date(b.start)).map((b) => (
                    <tr key={b.id}>
                      <td className="py-3">{new Date(b.start).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</td>
                      <td>{getRoom(b.roomCode)?.name}</td>
                      <td className="font-medium">{b.title}</td>
                      <td className="text-muted-foreground">{b.organizer}</td>
                      <td className="text-right">
                        <button onClick={() => removeBooking(b.id)} className="rounded-md px-2 py-1 text-xs text-destructive hover:bg-destructive/10">Cancel</button>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No bookings.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {tab === "rooms" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ROOMS.map((r) => {
              const s = getRoomStatus(r.code, bookings, now);
              const assigned = devices.find((d) => d.roomCode === r.code);
              return (
                <div key={r.code} className="rounded-2xl border bg-card p-5 shadow-soft">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{r.floor}</div>
                  <div className="mt-1 text-xl font-semibold">{r.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Room code: <span className="font-mono">{r.code}</span></div>
                  <div className="mt-3 text-sm">
                    Status: <span className="font-medium">{s.status}</span>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {assigned ? <>Panel device: <span className="font-mono">{assigned.id}</span></> : "No panel device assigned"}
                  </div>
                  <a href={`/panel/${r.code}`} target="_blank" rel="noreferrer"
                    className="mt-4 inline-flex w-full justify-center rounded-lg border px-3 py-2 text-sm transition-smooth hover:bg-muted">
                    Open room panel ↗
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function Widget({ label, value, sub, accent, warn }: { label: string; value: number; sub?: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-soft ${accent ? "bg-gradient-primary text-primary-foreground" : "bg-card"}`}>
      <div className={`text-xs uppercase tracking-wide ${accent ? "text-white/80" : "text-muted-foreground"}`}>{label}</div>
      <div className="mt-1 text-4xl font-semibold">{value}</div>
      {sub && <div className={`mt-1 text-xs ${accent ? "text-white/80" : warn ? "text-warning-foreground" : "text-muted-foreground"}`}>{sub}</div>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

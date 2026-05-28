import { useEffect, useState, useSyncExternalStore } from "react";

export interface Booking {
  id: string;
  roomCode: string;
  title: string;
  organizer: string;
  start: string; // ISO
  end: string;   // ISO
  createdAt: string;
}

export interface Device {
  id: string;
  registeredAt: string;
  roomCode: string | null;
  lastSeen: string;
}

const BOOKINGS_KEY = "mrm.bookings.v1";
const DEVICES_KEY = "mrm.devices.v1";
const ADMIN_KEY = "mrm.admin.v1";

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const isBrowser = typeof window !== "undefined";

const cache = new Map<string, any>();

function read<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  if (cache.has(key)) return cache.get(key);
  try {
    const raw = localStorage.getItem(key);
    const value = raw ? (JSON.parse(raw) as T) : fallback;
    cache.set(key, value);
    return value;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser) return;
  localStorage.setItem(key, JSON.stringify(value));
  cache.set(key, value);
  emit();
  // ping other tabs
  window.dispatchEvent(new StorageEvent("storage", { key }));
}

if (isBrowser) {
  // Clear any existing dummy data from localStorage on first run after this update
  if (localStorage.getItem("mrm.seeded.v1") !== "true") {
    localStorage.removeItem(BOOKINGS_KEY);
    localStorage.removeItem(DEVICES_KEY);
    localStorage.setItem("mrm.seeded.v1", "true");
  }

  window.addEventListener("storage", (e) => {
    if (e.key) cache.delete(e.key);
    emit();
  });
  // tick every 10s so countdowns/status refresh
  setInterval(emit, 10_000);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// ------- bookings -------
export function getBookings(): Booking[] {
  return read<Booking[]>(BOOKINGS_KEY, []);
}
export function addBooking(b: Omit<Booking, "id" | "createdAt">): Booking {
  const all = getBookings();
  const nb: Booking = { ...b, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  write(BOOKINGS_KEY, [...all, nb]);
  return nb;
}
export function removeBooking(id: string) {
  write(BOOKINGS_KEY, getBookings().filter((b) => b.id !== id));
}
export function updateBooking(id: string, patch: Partial<Booking>) {
  write(BOOKINGS_KEY, getBookings().map((b) => (b.id === id ? { ...b, ...patch } : b)));
}

// ------- devices -------
export function getDevices(): Device[] {
  return read<Device[]>(DEVICES_KEY, []);
}
export function registerDevice(): Device {
  const all = getDevices();
  const num = String(all.length + 1).padStart(3, "0");
  const d: Device = {
    id: `ROOMTAB-${num}`,
    registeredAt: new Date().toISOString(),
    roomCode: null,
    lastSeen: new Date().toISOString(),
  };
  write(DEVICES_KEY, [...all, d]);
  return d;
}
export function heartbeatDevice(id: string) {
  const all = getDevices();
  write(DEVICES_KEY, all.map((d) => (d.id === id ? { ...d, lastSeen: new Date().toISOString() } : d)));
}
export function assignDevice(id: string, roomCode: string | null) {
  write(DEVICES_KEY, getDevices().map((d) => (d.id === id ? { ...d, roomCode } : d)));
}
export function removeDevice(id: string) {
  write(DEVICES_KEY, getDevices().filter((d) => d.id !== id));
}

// ------- admin auth (mock) -------
export const ADMIN_CREDENTIALS = { username: "admin", password: "admin" };
export function loginAdmin(u: string, p: string) {
  if (u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password) {
    if (isBrowser) localStorage.setItem(ADMIN_KEY, "1");
    emit();
    return true;
  }
  return false;
}
export function logoutAdmin() {
  if (isBrowser) localStorage.removeItem(ADMIN_KEY);
  emit();
}
export function isAdmin(): boolean {
  if (!isBrowser) return false;
  return localStorage.getItem(ADMIN_KEY) === "1";
}

const EMPTY_BOOKINGS: Booking[] = [];
const EMPTY_DEVICES: Device[] = [];

// ------- hooks -------
export function useBookings() {
  return useSyncExternalStore(subscribe, getBookings, () => EMPTY_BOOKINGS);
}

export function useDevices() {
  return useSyncExternalStore(subscribe, getDevices, () => EMPTY_DEVICES);
}

export function useIsAdmin() {
  return useSyncExternalStore(subscribe, isAdmin, () => false);
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}

// ------- status helpers -------
export type RoomStatus = "available" | "soon" | "occupied";

export function getRoomStatus(roomCode: string, bookings: Booking[], now: Date) {
  const upcoming = bookings
    .filter((b) => b.roomCode === roomCode)
    .sort((a, b) => +new Date(a.start) - +new Date(b.start));
  const current = upcoming.find((b) => +new Date(b.start) <= +now && +new Date(b.end) > +now);
  const next = upcoming.find((b) => +new Date(b.start) > +now);
  let status: RoomStatus = "available";
  if (current) status = "occupied";
  else if (next && +new Date(next.start) - +now <= 15 * 60_000) status = "soon";
  return { status, current, next, all: upcoming };
}

export function formatCountdown(target: Date, now: Date) {
  const ms = +target - +now;
  if (ms <= 0) return "00:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function formatTime(d: string | Date) {
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

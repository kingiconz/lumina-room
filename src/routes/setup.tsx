import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getDevices, heartbeatDevice, registerDevice, useDevices } from "@/lib/store";

export const Route = createFileRoute("/setup")({
  component: SetupPage,
});

const LOCAL_DEVICE_KEY = "mrm.deviceId.v1";

function SetupPage() {
  const navigate = useNavigate();
  const devices = useDevices();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [registering, setRegistering] = useState(true);

  useEffect(() => {
    const existing = typeof window !== "undefined" ? localStorage.getItem(LOCAL_DEVICE_KEY) : null;
    if (existing && getDevices().find((d) => d.id === existing)) {
      setDeviceId(existing);
      setRegistering(false);
    } else {
      const t = setTimeout(() => {
        const d = registerDevice();
        localStorage.setItem(LOCAL_DEVICE_KEY, d.id);
        setDeviceId(d.id);
        setRegistering(false);
      }, 1400);
      return () => clearTimeout(t);
    }
  }, []);

  // heartbeat
  useEffect(() => {
    if (!deviceId) return;
    heartbeatDevice(deviceId);
    const id = setInterval(() => heartbeatDevice(deviceId), 5000);
    return () => clearInterval(id);
  }, [deviceId]);

  // auto-redirect when assigned
  const me = devices.find((d) => d.id === deviceId);
  useEffect(() => {
    if (me?.roomCode) {
      const t = setTimeout(() => navigate({ to: "/panel/$roomCode", params: { roomCode: me.roomCode! } }), 900);
      return () => clearTimeout(t);
    }
  }, [me?.roomCode, navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-hero p-6 text-primary-foreground">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_70%,white_0,transparent_40%)]" />

      <div className="relative w-full max-w-lg glass-dark rounded-3xl p-10 text-center shadow-elegant">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
          {registering ? (
            <svg className="h-10 w-10 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-3.5-7.1" />
            </svg>
          ) : (
            <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="3" width="16" height="18" rx="3" /><path d="M9 18h6" />
            </svg>
          )}
        </div>

        <div className="mt-6 text-sm uppercase tracking-[0.4em] opacity-80">Atrium Provisioning</div>
        <h1 className="mt-2 text-3xl font-semibold">
          {registering ? "Registering this device…" : me?.roomCode ? "Assigned · Launching panel" : "Waiting for room assignment"}
        </h1>

        {deviceId && (
          <div className="mx-auto mt-6 inline-flex animate-pulse-ring items-center gap-3 rounded-full bg-white/10 px-5 py-2 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-white" />
            <span className="font-mono text-base tracking-widest">{deviceId}</span>
          </div>
        )}

        <p className="mt-6 text-white/80">
          {registering
            ? "Generating a unique device identifier and contacting the workspace controller."
            : me?.roomCode
            ? "This tablet has been assigned. Redirecting now…"
            : "An administrator must assign this tablet to a meeting room. This screen will update automatically."}
        </p>

        <div className="mt-8 grid grid-cols-3 gap-3 text-xs">
          <Step label="Generate ID" done={!registering} />
          <Step label="Register" done={!registering} />
          <Step label="Assign Room" done={!!me?.roomCode} />
        </div>
      </div>
    </div>
  );
}

function Step({ label, done }: { label: string; done: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-2 backdrop-blur transition-smooth ${done ? "border-white/40 bg-white/15" : "border-white/15 bg-white/5 opacity-70"}`}>
      <div className="flex items-center justify-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${done ? "bg-white" : "bg-white/40"}`} />
        <span className="uppercase tracking-widest">{label}</span>
      </div>
    </div>
  );
}

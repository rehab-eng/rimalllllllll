"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import type { ActionResult } from "../driver/types";
import type { AdminStationFormPayload, AdminStationRow } from "./types";

type AdminStationManagerProps = {
  stations: AdminStationRow[];
  onSaveStation: (payload: AdminStationFormPayload) => Promise<ActionResult> | ActionResult;
  onToggleStation: (stationId: number, isActive: boolean) => Promise<ActionResult> | ActionResult;
};

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminStationManager({
  stations,
  onSaveStation,
  onToggleStation,
}: AdminStationManagerProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const [schedules, setSchedules] = useState(
    weekdays.map((_, dayIndex) => ({
      dayOfWeek: dayIndex,
      opensAt: "08:00",
      closesAt: "18:00",
      isEnabled: dayIndex !== 5,
    })),
  );

  const updateSchedule = (
    dayOfWeek: number,
    patch: Partial<(typeof schedules)[number]>,
  ) => {
    setSchedules((current) =>
      current.map((schedule) =>
        schedule.dayOfWeek === dayOfWeek ? { ...schedule, ...patch } : schedule,
      ),
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback("");

    startTransition(async () => {
      const result = await onSaveStation({
        name,
        location,
        isActive: true,
        schedules,
      });

      setFeedback(result.success ? "Station saved successfully." : result.error ?? "Unable to save station.");

      if (result.success) {
        setName("");
        setLocation("");
      }
    });
  };

  return (
    <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[32px] p-6 text-white shadow-2xl lg:p-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/20 bg-black/25 p-5">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">Station Control</p>
          <h2 className="mt-2 text-3xl font-black text-white">Create Fuel Point</h2>

          <div className="mt-5 grid gap-4">
            <Field label="Station Name">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Jbo Fuel Station"
                className="min-h-14 rounded-2xl border border-white/20 bg-black/30 px-4 text-base font-bold text-white outline-none placeholder:text-white/70"
              />
            </Field>

            <Field label="Location">
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="North yard"
                className="min-h-14 rounded-2xl border border-white/20 bg-black/30 px-4 text-base font-bold text-white outline-none placeholder:text-white/70"
              />
            </Field>

            <div>
              <p className="text-sm font-bold text-white">Open Days and Time Windows</p>
              <div className="mt-3 grid gap-3">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.dayOfWeek}
                    className="grid gap-3 rounded-2xl border border-white/20 bg-black/30 p-4 xl:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)] xl:items-center"
                  >
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={schedule.isEnabled}
                        onChange={(event) =>
                          updateSchedule(schedule.dayOfWeek, { isEnabled: event.target.checked })
                        }
                        className="h-5 w-5 accent-white"
                      />
                      <span className="text-sm font-black text-white">{weekdays[schedule.dayOfWeek]}</span>
                    </label>

                    <input
                      type="time"
                      value={schedule.opensAt}
                      onChange={(event) =>
                        updateSchedule(schedule.dayOfWeek, { opensAt: event.target.value })
                      }
                      className="min-h-12 rounded-2xl border border-white/20 bg-black/25 px-4 text-sm font-bold text-white outline-none"
                    />

                    <input
                      type="time"
                      value={schedule.closesAt}
                      onChange={(event) =>
                        updateSchedule(schedule.dayOfWeek, { closesAt: event.target.value })
                      }
                      className="min-h-12 rounded-2xl border border-white/20 bg-black/25 px-4 text-sm font-bold text-white outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {feedback ? <p className="text-sm font-bold text-white">{feedback}</p> : null}

            <button
              type="submit"
              disabled={isPending}
              className="min-h-14 rounded-2xl border border-white bg-white px-4 text-base font-black text-black disabled:opacity-60"
            >
              {isPending ? "Saving Station..." : "Save Station"}
            </button>
          </div>
        </form>

        <div className="rounded-[28px] border border-white/20 bg-black/25 p-5">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">Station Activity</p>
          <h3 className="mt-2 text-3xl font-black text-white">Live Status</h3>

          <div className="mt-5 grid gap-3">
            {stations.length === 0 ? (
              <div className="rounded-2xl border border-white/20 bg-black/30 p-4">
                <p className="text-base font-black text-white">No stations configured yet.</p>
              </div>
            ) : (
              stations.map((station) => (
                <div key={station.id} className="rounded-2xl border border-white/20 bg-black/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-white">{station.name}</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {station.location || "No location"} · {station.totalLogs} logs
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        station.runtimeStatus === "OPEN"
                          ? "bg-white text-black"
                          : "border border-white/20 bg-black/25 text-white"
                      }`}
                    >
                      {station.runtimeStatus}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {station.schedules.map((schedule) => (
                      <span
                        key={schedule.id}
                        className="rounded-full border border-white/20 bg-black/25 px-3 py-1 text-xs font-bold text-white"
                      >
                        {weekdays[schedule.day_of_week]} {schedule.opens_at}-{schedule.closes_at}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      startTransition(async () => {
                        const result = await onToggleStation(station.id, !station.is_active);
                        setFeedback(
                          result.success
                            ? station.is_active
                              ? "Station marked as inactive."
                              : "Station activated."
                            : result.error ?? "Unable to update station.",
                        );
                      })
                    }
                    className={`mt-4 min-h-12 rounded-2xl border px-4 text-sm font-black ${
                      station.is_active
                        ? "border-red-500 bg-red-600 text-white"
                        : "border-white bg-white text-black"
                    }`}
                  >
                    {station.is_active ? "Stop Station Activity" : "Activate Station"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-white">{label}</span>
      {children}
    </label>
  );
}

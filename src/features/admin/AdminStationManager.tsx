"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";

import { formatArabicNumber, stationRuntimeStatusLabels } from "../../lib/labels";
import { formatScheduleWindow, weekdayLabels } from "../../lib/station-status";
import type { ActionResult } from "../driver/types";
import type { AdminStationFormPayload, AdminStationRow } from "./types";

type AdminStationManagerProps = {
  stations: AdminStationRow[];
  onSaveStation: (payload: AdminStationFormPayload) => Promise<ActionResult> | ActionResult;
  onToggleStation: (stationId: number, isActive: boolean) => Promise<ActionResult> | ActionResult;
};

type ScheduleDraft = {
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isEnabled: boolean;
};

const defaultOpenTime = "08:00";
const defaultCloseTime = "18:00";

const createInitialSchedules = (): ScheduleDraft[] =>
  weekdayLabels.map((_, dayIndex) => ({
    dayOfWeek: dayIndex,
    opensAt: defaultOpenTime,
    closesAt: defaultCloseTime,
    isEnabled: dayIndex !== 5,
  }));

const normalizeTimeInput = (value: string): string => {
  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value.slice(0, 5);
  }

  return "";
};

export default function AdminStationManager({
  stations,
  onSaveStation,
  onToggleStation,
}: AdminStationManagerProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [editingStationId, setEditingStationId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [schedules, setSchedules] = useState<ScheduleDraft[]>(createInitialSchedules);

  const editingStation = useMemo(
    () => stations.find((station) => station.id === editingStationId) ?? null,
    [editingStationId, stations],
  );

  const updateSchedule = (dayOfWeek: number, patch: Partial<ScheduleDraft>) => {
    setSchedules((current) =>
      current.map((schedule) =>
        schedule.dayOfWeek === dayOfWeek ? { ...schedule, ...patch } : schedule,
      ),
    );
  };

  const hydrateFromStation = (station: AdminStationRow) => {
    const nextSchedules = createInitialSchedules();

    for (const dbSchedule of station.schedules) {
      const target = nextSchedules.find((item) => item.dayOfWeek === dbSchedule.day_of_week);
      if (!target) {
        continue;
      }

      target.opensAt = normalizeTimeInput(dbSchedule.opens_at) || defaultOpenTime;
      target.closesAt = normalizeTimeInput(dbSchedule.closes_at) || defaultCloseTime;
      target.isEnabled = Boolean(dbSchedule.is_enabled);
    }

    setEditingStationId(station.id);
    setName(station.name);
    setLocation(station.location ?? "");
    setSchedules(nextSchedules);
    setFeedback(null);
  };

  const resetForm = () => {
    setEditingStationId(null);
    setName("");
    setLocation("");
    setSchedules(createInitialSchedules());
    setFeedback(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const result = await onSaveStation({
        id: editingStationId ?? undefined,
        name,
        location,
        isActive: editingStation?.is_active ?? true,
        schedules,
      });

      if (!result.success) {
        setFeedback({
          kind: "error",
          text: result.error ?? "تعذر حفظ المحطة.",
        });
        return;
      }

      setFeedback({
        kind: "success",
        text: editingStationId ? "تم تحديث المحطة بنجاح." : "تم حفظ المحطة بنجاح.",
      });

      if (!editingStationId) {
        resetForm();
      }
    });
  };

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-right">
          <p className="text-xs font-black tracking-[0.18em] text-slate-500">STATIONS</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">المحطات الحالية</h3>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            تعديل الحالة والجدول الزمني لكل محطة من نفس الشاشة.
          </p>

          <div className="mt-5 grid gap-3">
            {stations.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-base font-black text-slate-700">لم يتم إعداد أي محطة بعد.</p>
              </div>
            ) : (
              stations.map((station) => (
                <div key={station.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        station.runtimeStatus === "OPEN"
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      {stationRuntimeStatusLabels[station.runtimeStatus]}
                    </span>

                    <div className="text-right">
                      <p className="text-lg font-black text-slate-950">{station.name}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {(station.location || "بدون موقع")} - {formatArabicNumber(station.totalLogs)} سجل
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    {station.schedules.map((schedule) => (
                      <span
                        key={schedule.id}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600"
                      >
                        {weekdayLabels[schedule.day_of_week]}{" "}
                        {formatScheduleWindow(schedule.opens_at, schedule.closes_at)}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => hydrateFromStation(station)}
                      className="min-h-10 rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-black text-white"
                    >
                      تعديل المحطة
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        startTransition(async () => {
                          const result = await onToggleStation(station.id, !station.is_active);
                          setFeedback(
                            result.success
                              ? {
                                  kind: "success",
                                  text: station.is_active ? "تم إيقاف المحطة." : "تم تفعيل المحطة.",
                                }
                              : {
                                  kind: "error",
                                  text: result.error ?? "تعذر تحديث حالة المحطة.",
                                },
                          );
                        })
                      }
                      className={`min-h-10 rounded-xl border px-4 text-sm font-black ${
                        station.is_active
                          ? "border-red-200 bg-red-50 text-red-600"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {station.is_active ? "إيقاف" : "تفعيل"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[24px] border border-slate-200 bg-white p-5 text-right">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"
            >
              محطة جديدة
            </button>

            <div>
              <p className="text-xs font-black tracking-[0.18em] text-slate-500">STATION FORM</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                {editingStationId ? "تعديل محطة" : "إضافة محطة جديدة"}
              </h2>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <Field label="اسم المحطة">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="مثال: محطة الجبو"
                className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
              />
            </Field>

            <Field label="الموقع أو الوصف">
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="مثال: الساحة الشمالية"
                className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
              />
            </Field>

            <div>
              <p className="text-sm font-black text-slate-800">أيام العمل وساعات التشغيل</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Time Picker حر بالدقيقة لكل يوم.
              </p>

              <div className="mt-3 grid gap-3">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.dayOfWeek}
                    className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px] xl:items-end"
                  >
                    <TimeField label="وقت الإغلاق">
                      <input
                        type="time"
                        step={60}
                        value={schedule.closesAt}
                        onChange={(event) =>
                          updateSchedule(schedule.dayOfWeek, {
                            closesAt: normalizeTimeInput(event.target.value),
                          })
                        }
                        className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none"
                      />
                    </TimeField>

                    <TimeField label="وقت الافتتاح">
                      <input
                        type="time"
                        step={60}
                        value={schedule.opensAt}
                        onChange={(event) =>
                          updateSchedule(schedule.dayOfWeek, {
                            opensAt: normalizeTimeInput(event.target.value),
                          })
                        }
                        className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none"
                      />
                    </TimeField>

                    <label className="flex items-center justify-end gap-3">
                      <span className="text-sm font-black text-slate-800">
                        {weekdayLabels[schedule.dayOfWeek]}
                      </span>
                      <input
                        type="checkbox"
                        checked={schedule.isEnabled}
                        onChange={(event) =>
                          updateSchedule(schedule.dayOfWeek, { isEnabled: event.target.checked })
                        }
                        className="h-5 w-5 accent-amber-500"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {feedback ? (
              <p
                className={`text-sm font-black ${
                  feedback.kind === "success" ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {feedback.text}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isPending}
              className="min-h-12 rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-black text-white disabled:opacity-60"
            >
              {isPending ? "جارٍ حفظ المحطة..." : editingStationId ? "تحديث المحطة" : "حفظ المحطة"}
            </button>
          </div>
        </form>
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
    <label className="grid gap-2 text-right">
      <span className="text-sm font-black text-slate-800">{label}</span>
      {children}
    </label>
  );
}

function TimeField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-right">
      <span className="text-xs font-black tracking-[0.1em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

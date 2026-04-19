"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type {
  ActionResult,
  DriverAuthVehicleInput,
  DriverLoginPayload,
  DriverRegisterPayload,
} from "./types";

type DriverAuthPanelProps = {
  onLogin: (payload: DriverLoginPayload) => Promise<ActionResult> | ActionResult;
  onRegister: (payload: DriverRegisterPayload) => Promise<ActionResult> | ActionResult;
};

const createEmptyVehicle = (): DriverAuthVehicleInput => ({
  platesNumber: "",
  trailerPlates: "",
  capacityLiters: "",
  cubicCapacity: "",
});

export default function DriverAuthPanel({ onLogin, onRegister }: DriverAuthPanelProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [hasSecondVehicle, setHasSecondVehicle] = useState(false);
  const [primaryVehicle, setPrimaryVehicle] = useState<DriverAuthVehicleInput>(createEmptyVehicle);
  const [secondaryVehicle, setSecondaryVehicle] = useState<DriverAuthVehicleInput>(createEmptyVehicle);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateVehicle = (
    target: "primary" | "secondary",
    patch: Partial<DriverAuthVehicleInput>,
  ) => {
    if (target === "primary") {
      setPrimaryVehicle((current) => ({ ...current, ...patch }));
      return;
    }

    setSecondaryVehicle((current) => ({ ...current, ...patch }));
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const result = await onLogin({
        phone: phone.trim(),
        licenseNumber: licenseNumber.trim(),
      });

      if (!result.success) {
        setFeedback({
          kind: "error",
          text: result.error ?? "تعذر تسجيل الدخول.",
        });
        return;
      }

      router.refresh();
    });
  };

  const handleRegister = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const vehicles = [primaryVehicle, ...(hasSecondVehicle ? [secondaryVehicle] : [])];

    startTransition(async () => {
      const result = await onRegister({
        fullName: fullName.trim(),
        phone: phone.trim(),
        licenseNumber: licenseNumber.trim(),
        vehicles,
      });

      if (!result.success) {
        setFeedback({
          kind: "error",
          text: result.error ?? "تعذر إنشاء الحساب.",
        });
        return;
      }

      router.refresh();
    });
  };

  return (
    <section className="mx-auto flex min-h-screen w-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_32px_80px_-48px_rgba(15,23,42,0.35)]">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setFeedback(null);
            }}
            className={`min-h-11 rounded-full px-4 text-sm font-black ${
              mode === "register"
                ? "bg-amber-500 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            إنشاء حساب
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setFeedback(null);
            }}
            className={`min-h-11 rounded-full px-4 text-sm font-black ${
              mode === "login" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            تسجيل الدخول
          </button>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="mt-6 grid gap-4 text-right">
            <div>
              <h1 className="text-3xl font-black text-slate-950">تسجيل الدخول</h1>
              <p className="mt-2 text-sm font-semibold leading-7 text-slate-500">
                أدخل رقم الهاتف ورقم الرخصة للمتابعة.
              </p>
            </div>

            <Field label="رقم الهاتف">
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0912345678"
                className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
              />
            </Field>

            <Field label="رقم الرخصة">
              <input
                value={licenseNumber}
                onChange={(event) => setLicenseNumber(event.target.value)}
                placeholder="LIC-1200"
                className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
              />
            </Field>

            <Feedback feedback={feedback} />

            <button
              type="submit"
              disabled={isPending}
              className="min-h-14 rounded-2xl bg-amber-500 px-4 text-base font-black text-white disabled:opacity-60"
            >
              {isPending ? "جارٍ التحقق..." : "دخول"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="mt-6 grid gap-4 text-right">
            <div>
              <h1 className="text-3xl font-black text-slate-950">إنشاء حساب جديد</h1>
              <p className="mt-2 text-sm font-semibold leading-7 text-slate-500">
                بيانات السائق ثم بيانات الشاحنة الأساسية.
              </p>
            </div>

            <Field label="اسم السائق">
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="الاسم الكامل"
                className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
              />
            </Field>

            <Field label="رقم الهاتف">
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0912345678"
                className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
              />
            </Field>

            <Field label="رقم الرخصة">
              <input
                value={licenseNumber}
                onChange={(event) => setLicenseNumber(event.target.value)}
                placeholder="LIC-1200"
                className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
              />
            </Field>

            <VehicleForm
              title="الشاحنة الأولى"
              vehicle={primaryVehicle}
              onChange={(patch) => updateVehicle("primary", patch)}
            />

            <label className="flex items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <span className="text-sm font-black text-slate-800">أملك أكثر من شاحنة</span>
              <input
                type="checkbox"
                checked={hasSecondVehicle}
                onChange={(event) => setHasSecondVehicle(event.target.checked)}
                className="h-5 w-5 accent-amber-500"
              />
            </label>

            {hasSecondVehicle ? (
              <VehicleForm
                title="الشاحنة الثانية"
                vehicle={secondaryVehicle}
                onChange={(patch) => updateVehicle("secondary", patch)}
              />
            ) : null}

            <Feedback feedback={feedback} />

            <button
              type="submit"
              disabled={isPending}
              className="min-h-14 rounded-2xl bg-amber-500 px-4 text-base font-black text-white disabled:opacity-60"
            >
              {isPending ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-slate-800">{label}</span>
      {children}
    </label>
  );
}

function VehicleForm({
  title,
  vehicle,
  onChange,
}: {
  title: string;
  vehicle: DriverAuthVehicleInput;
  onChange: (patch: Partial<DriverAuthVehicleInput>) => void;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-base font-black text-slate-950">{title}</h3>

      <div className="mt-4 grid gap-4">
        <Field label="رقم لوحة الشاحنة">
          <input
            value={vehicle.platesNumber}
            onChange={(event) => onChange({ platesNumber: event.target.value })}
            placeholder="123 ليبيا"
            className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
          />
        </Field>

        <Field label="رقم لوحة المقطورة">
          <input
            value={vehicle.trailerPlates}
            onChange={(event) => onChange({ trailerPlates: event.target.value })}
            placeholder="اختياري"
            className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="سعة التانك باللتر">
            <input
              type="number"
              min="0"
              step="0.01"
              lang="en-GB"
              dir="ltr"
              inputMode="decimal"
              value={vehicle.capacityLiters}
              onChange={(event) => onChange({ capacityLiters: event.target.value })}
              placeholder="16000"
              className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-left font-sans text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
            />
          </Field>

          <Field label="تكعيب الشاحنة">
            <input
              type="number"
              min="0"
              step="0.01"
              lang="en-GB"
              dir="ltr"
              inputMode="decimal"
              value={vehicle.cubicCapacity}
              onChange={(event) => onChange({ cubicCapacity: event.target.value })}
              placeholder="45"
              className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-left font-sans text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
            />
          </Field>
        </div>
      </div>
    </section>
  );
}

function Feedback({
  feedback,
}: {
  feedback: { kind: "success" | "error"; text: string } | null;
}) {
  if (!feedback) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        feedback.kind === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      <p className="text-sm font-black">{feedback.text}</p>
    </div>
  );
}

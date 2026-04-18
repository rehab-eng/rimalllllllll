"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

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

const DEVICE_TOKEN_KEY = "rimall_device_token";

const createEmptyVehicle = (): DriverAuthVehicleInput => ({
  platesNumber: "",
  trailerPlates: "",
  capacityLiters: 0,
  cubicCapacity: 0,
});

export default function DriverAuthPanel({ onLogin, onRegister }: DriverAuthPanelProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [deviceToken, setDeviceToken] = useState("");
  const [deviceError, setDeviceError] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [hasSecondVehicle, setHasSecondVehicle] = useState(false);
  const [primaryVehicle, setPrimaryVehicle] = useState<DriverAuthVehicleInput>(createEmptyVehicle);
  const [secondaryVehicle, setSecondaryVehicle] = useState<DriverAuthVehicleInput>(createEmptyVehicle);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const existingToken = window.localStorage.getItem(DEVICE_TOKEN_KEY);
      if (existingToken) {
        setDeviceToken(existingToken);
        return;
      }

      const nextToken = window.crypto.randomUUID();
      window.localStorage.setItem(DEVICE_TOKEN_KEY, nextToken);
      setDeviceToken(nextToken);
    } catch {
      setDeviceError("تعذر تجهيز هوية هذا الجهاز. افتح الصفحة من متصفح يدعم التخزين المحلي.");
    }
  }, []);

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

    if (!deviceToken) {
      setFeedback({
        kind: "error",
        text: deviceError || "تعذر التحقق من الجهاز الحالي.",
      });
      return;
    }

    startTransition(async () => {
      const result = await onLogin({
        phone: phone.trim(),
        licenseNumber: licenseNumber.trim(),
        deviceToken,
      });

      if (!result.success) {
        setFeedback({
          kind: "error",
          text: result.error ?? "تعذر تسجيل الدخول.",
        });
        return;
      }

      setFeedback({
        kind: "success",
        text: "تم تسجيل الدخول بنجاح.",
      });
      router.refresh();
    });
  };

  const handleRegister = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!deviceToken) {
      setFeedback({
        kind: "error",
        text: deviceError || "تعذر تجهيز هوية الجهاز.",
      });
      return;
    }

    const vehicles = [primaryVehicle, ...(hasSecondVehicle ? [secondaryVehicle] : [])];

    startTransition(async () => {
      const result = await onRegister({
        fullName: fullName.trim(),
        phone: phone.trim(),
        licenseNumber: licenseNumber.trim(),
        deviceToken,
        vehicles,
      });

      if (!result.success) {
        setFeedback({
          kind: "error",
          text: result.error ?? "تعذر إنشاء الحساب.",
        });
        return;
      }

      setFeedback({
        kind: "success",
        text: "تم إنشاء الحساب وربط هذا الجهاز بنجاح.",
      });
      router.refresh();
    });
  };

  return (
    <section className="mx-auto w-full max-w-5xl rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_80px_-48px_rgba(15,23,42,0.35)]">
      <div className="grid lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-slate-50 p-6 lg:border-b-0 lg:border-l">
          <p className="text-right text-xs font-black tracking-[0.18em] text-slate-500">RIMALL DRIVER PORTAL</p>
          <h1 className="mt-3 text-right text-3xl font-black text-slate-950">بوابة السائق</h1>
          <p className="mt-3 text-right text-sm font-semibold leading-7 text-slate-600">
            تسجيل دخول دائم، ربط الجهاز تلقائياً، ودعم أكثر من شاحنة في نفس الحساب.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-right">
              <p className="text-sm font-black text-slate-800">ربط الجهاز</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                أول جهاز يدخل الحساب يصبح الجهاز المعتمد. أي جهاز آخر سيتم منعه تلقائياً.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-right">
              <p className="text-sm font-black text-slate-800">الجلسة</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                بعد نجاح الدخول ستبقى الجلسة محفوظة ولن يُطلب منك تسجيل الدخول كل مرة.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-right">
            <p className="text-sm font-black text-slate-800">حالة الجهاز</p>
            <p className="mt-2 text-xs font-bold tracking-[0.08em] text-slate-500">
              {deviceToken ? `${deviceToken.slice(0, 12)}...` : "جارٍ التجهيز..."}
            </p>
            {deviceError ? <p className="mt-2 text-sm font-black text-red-600">{deviceError}</p> : null}
          </div>
        </aside>

        <div className="p-6 lg:p-8">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setFeedback(null);
              }}
              className={`min-h-11 rounded-xl border px-4 text-sm font-black ${
                mode === "register"
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-slate-200 bg-white text-slate-700"
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
              className={`min-h-11 rounded-xl border px-4 text-sm font-black ${
                mode === "login"
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              تسجيل الدخول
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="mt-6 grid gap-4 text-right">
              <div>
                <p className="text-xs font-black tracking-[0.18em] text-slate-500">DRIVER SIGN IN</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">الدخول إلى الحساب</h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  ادخل رقم الهاتف أو رقم الرخصة. سيتم التحقق من الجهاز تلقائياً.
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
                disabled={isPending || !deviceToken}
                className="min-h-14 rounded-2xl border border-amber-500 bg-amber-500 px-4 text-base font-black text-white disabled:opacity-60"
              >
                {isPending ? "جارٍ التحقق..." : "دخول إلى بوابة السائق"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="mt-6 grid gap-5 text-right">
              <div>
                <p className="text-xs font-black tracking-[0.18em] text-slate-500">DRIVER REGISTRATION</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">إنشاء حساب جديد</h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  سيتم إنشاء الحساب وربط هذا الجهاز به من أول مرة.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
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
              </div>

              <VehicleForm
                title="بيانات الشاحنة الأولى"
                description="أدخل بيانات المركبة الأساسية المرتبطة بالحساب."
                vehicle={primaryVehicle}
                onChange={(patch) => updateVehicle("primary", patch)}
              />

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <label className="flex items-center justify-end gap-3">
                  <span className="text-sm font-black text-slate-800">أملك أكثر من شاحنة</span>
                  <input
                    type="checkbox"
                    checked={hasSecondVehicle}
                    onChange={(event) => setHasSecondVehicle(event.target.checked)}
                    className="h-5 w-5 accent-amber-500"
                  />
                </label>
              </div>

              {hasSecondVehicle ? (
                <VehicleForm
                  title="بيانات الشاحنة الثانية"
                  description="ستُربط هذه المركبة بنفس حساب السائق."
                  vehicle={secondaryVehicle}
                  onChange={(patch) => updateVehicle("secondary", patch)}
                />
              ) : null}

              <Feedback feedback={feedback} />

              <button
                type="submit"
                disabled={isPending || !deviceToken}
                className="min-h-14 rounded-2xl border border-amber-500 bg-amber-500 px-4 text-base font-black text-white disabled:opacity-60"
              >
                {isPending ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب وربط الجهاز"}
              </button>
            </form>
          )}
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
  description,
  vehicle,
  onChange,
}: {
  title: string;
  description: string;
  vehicle: DriverAuthVehicleInput;
  onChange: (patch: Partial<DriverAuthVehicleInput>) => void;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
      <div>
        <h3 className="text-lg font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm font-semibold text-slate-600">{description}</p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="رقم لوحة الشاحنة">
          <input
            value={vehicle.platesNumber}
            onChange={(event) => onChange({ platesNumber: event.target.value })}
            placeholder="مثال: 123-ليبيا"
            className="min-h-14 rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
          />
        </Field>

        <Field label="رقم لوحة المقطورة">
          <input
            value={vehicle.trailerPlates}
            onChange={(event) => onChange({ trailerPlates: event.target.value })}
            placeholder="اختياري"
            className="min-h-14 rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
          />
        </Field>

        <Field label="سعة التانك باللتر">
          <input
            type="number"
            min="0"
            value={vehicle.capacityLiters || ""}
            onChange={(event) => onChange({ capacityLiters: Number(event.target.value) })}
            placeholder="مثال: 16000"
            className="min-h-14 rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
          />
        </Field>

        <Field label="تكعيب الشاحنة">
          <input
            type="number"
            min="0"
            step="0.01"
            value={vehicle.cubicCapacity || ""}
            onChange={(event) => onChange({ cubicCapacity: Number(event.target.value) })}
            placeholder="مثال: 45"
            className="min-h-14 rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
          />
        </Field>
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

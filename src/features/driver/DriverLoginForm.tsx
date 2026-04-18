"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { ActionResult } from "./types";

export type DriverLoginPayload = {
  phone: string;
  licenseNumber: string;
};

type DriverLoginFormProps = {
  onLogin: (payload: DriverLoginPayload) => Promise<ActionResult> | ActionResult;
};

export default function DriverLoginForm({ onLogin }: DriverLoginFormProps) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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

      setFeedback({
        kind: "success",
        text: "تم تسجيل الدخول بنجاح.",
      });
      router.refresh();
    });
  };

  return (
    <section className="mx-auto w-full max-w-md rounded-[30px] border border-amber-200 bg-amber-50/90 p-6 shadow-2xl">
      <p className="text-right text-xs font-bold tracking-[0.14em] text-amber-900">بوابة السائق</p>
      <h1 className="mt-2 text-right text-3xl font-black text-amber-950">تسجيل الدخول</h1>
      <p className="mt-2 text-right text-sm font-semibold text-amber-900">
        ادخل برقم الهاتف أو رقم الرخصة للوصول إلى حسابك.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 text-right">
        <label className="grid gap-2">
          <span className="text-sm font-bold text-amber-900">رقم الهاتف</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="مثال: 0912345678"
            className="min-h-14 rounded-2xl border border-amber-200 bg-white px-4 text-base font-bold text-amber-950 outline-none placeholder:text-amber-700/60"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-bold text-amber-900">رقم الرخصة</span>
          <input
            value={licenseNumber}
            onChange={(event) => setLicenseNumber(event.target.value)}
            placeholder="مثال: LIC-12345"
            className="min-h-14 rounded-2xl border border-amber-200 bg-white px-4 text-base font-bold text-amber-950 outline-none placeholder:text-amber-700/60"
          />
        </label>

        {feedback ? (
          <div
            className={`rounded-2xl border px-4 py-3 ${
              feedback.kind === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <p className="text-sm font-black">{feedback.text}</p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="min-h-14 rounded-2xl border border-amber-300 bg-amber-200 px-4 text-base font-black text-amber-950 disabled:opacity-60"
        >
          {isPending ? "جارٍ التحقق..." : "دخول إلى بوابة السائق"}
        </button>
      </form>
    </section>
  );
}

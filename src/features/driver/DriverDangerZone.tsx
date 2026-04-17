"use client";

import { useTransition } from "react";

import type { ActionResult } from "./types";

type DriverDangerZoneProps = {
  onDeleteAccount: () => Promise<ActionResult> | ActionResult;
};

export default function DriverDangerZone({ onDeleteAccount }: DriverDangerZoneProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const shouldDelete = window.confirm(
      "هل تريد حذف حساب السائق؟ سيتم إيقاف الحساب وإبقاؤه فقط لأغراض السجل.",
    );

    if (!shouldDelete) {
      return;
    }

    startTransition(async () => {
      await onDeleteAccount();
    });
  };

  return (
    <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[28px] p-5 shadow-2xl text-right">
      <p className="text-xs font-bold tracking-[0.14em] text-white">منطقة حساسة</p>
      <h3 className="mt-2 text-2xl font-black text-white">حذف حسابي</h3>
      <p className="mt-3 text-sm font-semibold text-white">
        سيتم إخفاء الحساب من الاستخدام اليومي ووضعه كمحذوف داخل المنظومة ليبقى محفوظًا في السجلات.
      </p>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="mt-5 min-h-14 w-full rounded-2xl border border-red-500 bg-red-600 px-4 text-base font-black text-white disabled:cursor-not-allowed disabled:bg-red-500/60"
      >
        {isPending ? "جارٍ الحذف..." : "حذف حساب السائق"}
      </button>
    </section>
  );
}

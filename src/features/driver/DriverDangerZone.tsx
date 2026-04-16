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
      "Delete this driver account? The account will be disabled and kept only for records.",
    );

    if (!shouldDelete) {
      return;
    }

    startTransition(async () => {
      await onDeleteAccount();
    });
  };

  return (
    <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[28px] p-5 shadow-2xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white">Danger Zone</p>
      <h3 className="mt-2 text-2xl font-black text-white">Delete My Account</h3>
      <p className="mt-3 text-sm font-semibold text-white">
        This hides your account from active use and marks it as deleted for the admin team.
      </p>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="mt-5 min-h-14 w-full rounded-2xl border border-red-500 bg-red-600 px-4 text-base font-black text-white disabled:cursor-not-allowed disabled:bg-red-500/60"
      >
        {isPending ? "Deleting..." : "Delete Driver Account"}
      </button>
    </section>
  );
}

import { formatArabicNumber } from "../../lib/labels";

type Metric = {
  label: string;
  value: number | string;
  tone?: "default" | "highlight";
};

type AdminPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  metrics?: Metric[];
};

export default function AdminPageHeader({
  eyebrow,
  title,
  description,
  metrics = [],
}: AdminPageHeaderProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-right">
        <p className="text-xs font-black tracking-[0.18em] text-slate-500">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
          {description}
        </p>
      </div>

      {metrics.length > 0 ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className={`rounded-2xl border px-4 py-4 text-right ${
                metric.tone === "highlight"
                  ? "border-amber-200 bg-amber-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <p className="text-sm font-black text-slate-700">{metric.label}</p>
              <p className="mt-3 text-3xl font-black text-slate-950">
                {typeof metric.value === "number"
                  ? formatArabicNumber(metric.value)
                  : metric.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

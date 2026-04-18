export default function AdminSettingsPanel() {
  const items = [
    {
      label: "حماية الجهاز",
      value: "مفعلة",
      description: "أول جهاز يسجل الدخول يُربط بالحساب، وأي جهاز آخر يتم منعه.",
    },
    {
      label: "جلسة السائق",
      value: "دائمة",
      description: "يتم حفظ الجلسة لمدة طويلة لتقليل طلبات تسجيل الدخول المتكررة.",
    },
    {
      label: "محرك البيانات",
      value: "@neondatabase/serverless",
      description: "كل العمليات تعمل عبر SQL مباشر بدون Prisma لتفادي زيادة حجم الـ Worker.",
    },
  ];

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-right">
        <p className="text-xs font-black tracking-[0.18em] text-slate-500">SETTINGS</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">إعدادات التشغيل</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          ملخص السياسات النشطة داخل المنظومة حالياً.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-right">
            <p className="text-sm font-black text-slate-700">{item.label}</p>
            <p className="mt-3 text-lg font-black text-slate-950">{item.value}</p>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

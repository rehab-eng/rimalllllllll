import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.2),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(146,64,14,0.14),transparent_35%),linear-gradient(135deg,#fffbeb_0%,#fef3c7_42%,#fde68a_100%)] px-6 py-10 text-amber-950 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-[36px] border border-amber-200 bg-amber-50/85 p-8 shadow-2xl backdrop-blur-md lg:p-10">
          <p className="text-sm font-bold tracking-[0.12em] text-amber-900">منظومة رمال لاينز</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-amber-950 lg:text-6xl">
            منصة عربية بسيطة لإدارة السائقين والمحطات وتأكيدات الوقود.
          </h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-amber-900">
            السائق يؤكد استلام الوقود من هاتفه بخطوات واضحة، بينما تتحكم الإدارة في المحطات وساعات
            العمل والحسابات وسجل التعبئة من لوحة واحدة.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href="/driver"
              className="rounded-[28px] border border-amber-300 bg-white px-6 py-6 text-amber-950 shadow-xl"
            >
              <p className="text-sm font-bold tracking-[0.12em] text-amber-900">بوابة السائق</p>
              <p className="mt-3 text-3xl font-black text-amber-950">فتح تطبيق السائق</p>
              <p className="mt-3 text-sm font-semibold text-amber-900">
                تأكيد تعبئة سريع، عرض الشاحنات، ومتابعة المحطات المتاحة.
              </p>
            </Link>

            <Link
              href="/admin"
              className="rounded-[28px] border border-amber-200 bg-amber-100/80 px-6 py-6 text-amber-950 shadow-xl"
            >
              <p className="text-sm font-bold tracking-[0.12em] text-amber-900">لوحة الإدارة</p>
              <p className="mt-3 text-3xl font-black text-amber-950">فتح المنظومة</p>
              <p className="mt-3 text-sm font-semibold text-amber-900">
                إدارة السائقين والمحطات وسجل التعبئة الكامل من مكان واحد.
              </p>
            </Link>
          </div>
        </section>

        <section className="rounded-[36px] border border-amber-200 bg-amber-50/85 p-8 shadow-2xl backdrop-blur-md lg:p-10">
          <div className="space-y-5">
            <div className="rounded-[28px] border border-amber-200 bg-white/80 p-5">
              <p className="text-sm font-bold tracking-[0.12em] text-amber-900">البنية التقنية</p>
              <p className="mt-3 text-lg font-black text-amber-950">Next.js App Router + Neon SQL</p>
            </div>

            <div className="rounded-[28px] border border-amber-200 bg-white/80 p-5">
              <p className="text-sm font-bold tracking-[0.12em] text-amber-900">تجربة السائق</p>
              <p className="mt-3 text-lg font-black text-amber-950">
                تسجيل دخول بسيط، تعبئة وقود، وإضافة شاحنات إضافية.
              </p>
            </div>

            <div className="rounded-[28px] border border-amber-200 bg-white/80 p-5">
              <p className="text-sm font-bold tracking-[0.12em] text-amber-900">تجربة الإدارة</p>
              <p className="mt-3 text-lg font-black text-amber-950">
                مراقبة فورية للسجلات، وتحرير المحطات، والتحكم في حالة السائقين.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 text-white lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[36px] p-8 shadow-2xl lg:p-10">
          <p className="text-sm font-bold tracking-[0.12em] text-white">منظومة رمّال لاينز</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white lg:text-6xl">
            منصة عربية بسيطة لإدارة السائقين والمحطات وتأكيدات الوقود.
          </h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white">
            السائق يؤكد استلام الوقود من هاتفه بخطوات واضحة، بينما تتحكم الإدارة في المحطات
            وساعات العمل والحسابات وسجل التعبئة من لوحة واحدة.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href="/driver"
              className="rounded-[28px] border border-white bg-white px-6 py-6 text-black shadow-xl"
            >
              <p className="text-sm font-bold tracking-[0.12em] text-black">بوابة السائق</p>
              <p className="mt-3 text-3xl font-black text-black">فتح تطبيق السائق</p>
              <p className="mt-3 text-sm font-semibold text-black">
                إجمالي اللترات، دعم أكثر من شاحنة، المحطات المتاحة، وتأكيد تعبئة سهل جدًا.
              </p>
            </Link>

            <Link
              href="/admin"
              className="rounded-[28px] border border-white/20 bg-black/35 px-6 py-6 text-white shadow-xl"
            >
              <p className="text-sm font-bold tracking-[0.12em] text-white">لوحة الإدارة</p>
              <p className="mt-3 text-3xl font-black text-white">فتح المنظومة</p>
              <p className="mt-3 text-sm font-semibold text-white">
                لوحة مباشرة للمحطات، الحسابات، السجلات الحية، والتصدير إلى إكسل.
              </p>
            </Link>
          </div>
        </section>

        <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[36px] p-8 shadow-2xl lg:p-10">
          <div className="space-y-5">
            <div className="rounded-[28px] border border-white/20 bg-black/30 p-5">
              <p className="text-sm font-bold tracking-[0.12em] text-white">البنية التقنية</p>
              <p className="mt-3 text-lg font-black text-white">Next.js App Router و Prisma 7 و Neon و Pusher</p>
            </div>

            <div className="rounded-[28px] border border-white/20 bg-black/30 p-5">
              <p className="text-sm font-bold tracking-[0.12em] text-white">تجربة السائق</p>
              <p className="mt-3 text-lg font-black text-white">أزرار كبيرة، بطاقات محطات واضحة، وإجماليات ظاهرة</p>
            </div>

            <div className="rounded-[28px] border border-white/20 bg-black/30 p-5">
              <p className="text-sm font-bold tracking-[0.12em] text-white">تجربة الإدارة</p>
              <p className="mt-3 text-lg font-black text-white">ألواح زجاجية واسعة للمحطات والحسابات وسجل التعبئة المباشر</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

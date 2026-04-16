import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 text-white lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[36px] p-8 shadow-2xl lg:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-white">Rimall Lines ERP</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white lg:text-6xl">
            Marble-glass fuel control for drivers, stations, and the operations room.
          </h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white">
            Drivers confirm fuel with large mobile-first actions, while the admin team controls
            stations, schedules, account activity, and live fuel records in one desktop panel.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href="/driver"
              className="rounded-[28px] border border-white bg-white px-6 py-6 text-black shadow-xl"
            >
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-black">Driver Portal</p>
              <p className="mt-3 text-3xl font-black text-black">Open Mobile App</p>
              <p className="mt-3 text-sm font-semibold text-black">
                Total liters, multi-truck support, stations, and idiot-proof fuel confirmation.
              </p>
            </Link>

            <Link
              href="/admin"
              className="rounded-[28px] border border-white/20 bg-black/35 px-6 py-6 text-white shadow-xl"
            >
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-white">Admin ERP</p>
              <p className="mt-3 text-3xl font-black text-white">Open Desktop Panel</p>
              <p className="mt-3 text-sm font-semibold text-white">
                Realtime dashboard, station control, account powers, and export controls.
              </p>
            </Link>
          </div>
        </section>

        <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[36px] p-8 shadow-2xl lg:p-10">
          <div className="space-y-5">
            <div className="rounded-[28px] border border-white/20 bg-black/30 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-white">System Stack</p>
              <p className="mt-3 text-lg font-black text-white">Next.js App Router, Prisma 7, Neon, Pusher</p>
            </div>

            <div className="rounded-[28px] border border-white/20 bg-black/30 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-white">Driver UX</p>
              <p className="mt-3 text-lg font-black text-white">Large touch targets, station cards, and visible totals</p>
            </div>

            <div className="rounded-[28px] border border-white/20 bg-black/30 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-white">Admin UX</p>
              <p className="mt-3 text-lg font-black text-white">Wide glass panels for stations, accounts, and realtime logs</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

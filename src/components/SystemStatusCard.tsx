type SystemStatusCardProps = {
  title: string;
  description: string;
  details?: string;
};

export default function SystemStatusCard({
  title,
  description,
  details,
}: SystemStatusCardProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-10">
      <section className="bg-white/10 backdrop-blur-md border border-white/20 w-full rounded-[34px] p-6 text-white shadow-2xl lg:p-8">
        <div className="rounded-[28px] border border-white/20 bg-black/30 p-6">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-white">Rimall Lines ERP</p>
          <h1 className="mt-4 text-3xl font-black text-white lg:text-4xl">{title}</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-white">{description}</p>
          {details ? (
            <div className="mt-5 rounded-2xl border border-white/20 bg-black/35 px-4 py-3">
              <p className="text-sm font-semibold text-white">{details}</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

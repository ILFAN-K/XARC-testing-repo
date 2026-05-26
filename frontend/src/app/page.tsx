async function fetchHealth() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  try {
    const response = await fetch(`${baseUrl}/health`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return { status: 'error', message: (error as Error).message };
  }
}

export default async function Home() {
  const health = await fetchHealth();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
      <section className="mx-auto max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/80 p-10 shadow-xl shadow-slate-950/30 backdrop-blur-md">
        <h1 className="text-4xl font-semibold">XARC Nexus Hub</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Central platform for XR module distribution, analytics, device monitoring, and instructor-led training operations.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-slate-950/90 p-6 ring-1 ring-slate-700">
            <h2 className="text-xl font-semibold">Frontend</h2>
            <p className="mt-2 text-slate-400">Next.js + Tailwind CSS starter with API integration to the backend.</p>
          </div>
          <div className="rounded-3xl bg-slate-950/90 p-6 ring-1 ring-slate-700">
            <h2 className="text-xl font-semibold">Backend</h2>
            <p className="mt-2 text-slate-400">NestJS API provides health checks and backend routing for Hub services.</p>
          </div>
        </div>

        <div className="mt-10 rounded-3xl bg-slate-800/90 p-6 ring-1 ring-slate-700">
          <h2 className="text-2xl font-semibold">Backend health status</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950/80 p-4 text-sm text-slate-200">
            {JSON.stringify(health, null, 2)}
          </pre>
        </div>
      </section>
    </main>
  );
}

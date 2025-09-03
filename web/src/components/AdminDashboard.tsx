import React, { useEffect, useMemo, useState } from "react";

/**
 * CONFIG
 * If you route /draft/* on the same domain as the Pages site, leave API_BASE = "".
 * Otherwise point at your Worker (and be sure CORS is enabled):
 *   const API_BASE = "https://api.bristolbloods.com";
 */
const API_BASE = "https://api.bristolbloods.com";
const DRAFT_ID = "2025-bristol-bloods";

type TabKey = "upload" | "validate" | "generate" | "preview";

type Jsonish = any;

type UploadStat = { label: string; ok?: boolean; detail?: string; ts?: number };

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

// API helpers
async function postJSON<T = any>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${API_BASE}/draft/${DRAFT_ID}${path}`, {
    method: "POST",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function postFile<T = any>(path: string, file: File): Promise<T> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/draft/${DRAFT_ID}${path}`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function getJSON<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/draft/${DRAFT_ID}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function AdminDashboard() {
  const [active, setActive] = useState<TabKey>("validate");
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Upload state
  const [masterStat, setMasterStat] = useState<UploadStat | null>(null);
  const [resultsStat, setResultsStat] = useState<UploadStat | null>(null);
  const [keepersJson, setKeepersJson] = useState<string>("");

  // Results panels
  const [validateOut, setValidateOut] = useState<Jsonish | null>(null);
  const [preEnrichOut, setPreEnrichOut] = useState<Jsonish | null>(null);
  const [generateOut, setGenerateOut] = useState<Jsonish | null>(null);
  const [report, setReport] = useState<Jsonish | null>(null);

  // Activity feed
  const [activity, setActivity] = useState<string[]>([]);

  function logActivity(line: string) {
    const ts = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setActivity((a) => [`${ts}  ${line}`, ...a].slice(0, 200));
  }

  function flash(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  // Upload handlers
  async function handleUploadMaster(file: File) {
    setStatus("working");
    try {
      const res = await postFile("/upload-master", file);
      setMasterStat({ label: "Master uploaded", ok: true, detail: `rows/bytes: ${res.bytes ?? "?"}`, ts: Date.now() });
      logActivity(`Master uploaded ✓ rows/bytes: ${res.bytes ?? "?"}`);
      flash("success", "Master uploaded");
    } catch (err: any) {
      setMasterStat({ label: "Master upload failed", ok: false, detail: err?.message, ts: Date.now() });
      logActivity(`Master upload failed: ${String(err?.message || err)}`);
      flash("error", "Master upload failed");
    } finally {
      setStatus("idle");
    }
  }
  async function handleUploadResults(file: File) {
    setStatus("working");
    try {
      const res = await postFile("/upload-results", file);
      setResultsStat({ label: "Results uploaded", ok: true, detail: `rows/bytes: ${res.bytes ?? "?"}`, ts: Date.now() });
      logActivity(`Results uploaded ✓ rows/bytes: ${res.bytes ?? "?"}`);
      flash("success", "Results uploaded");
    } catch (err: any) {
      setResultsStat({ label: "Results upload failed", ok: false, detail: err?.message, ts: Date.now() });
      logActivity(`Results upload failed: ${String(err?.message || err)}`);
      flash("error", "Results upload failed");
    } finally {
      setStatus("idle");
    }
  }
  async function handleSaveKeepers() {
    setStatus("working");
    try {
      const parsed = JSON.parse(keepersJson || "{}");
      const res = await postJSON("/keepers", { keepers: parsed?.keepers ?? [] });
      logActivity(`Keepers saved ✓ count: ${res.count ?? "?"}`);
      flash("success", "Keepers saved");
    } catch (err: any) {
      logActivity(`Keepers save failed: ${String(err?.message || err)}`);
      flash("error", "Keepers save failed (check JSON)");
    } finally {
      setStatus("idle");
    }
  }

  // Validate
  async function runValidate() {
    setStatus("working");
    try {
      const res = await postJSON("/validate");
      setValidateOut(res);
      flash("success", "Validation OK");
      logActivity(`Validate ✓ master=${String(res?.schema?.masterEval)} results=${String(res?.schema?.draftResults)}`);
    } catch (err: any) {
      setValidateOut({ error: String(err?.message || err) });
      flash("error", "Validation failed");
      logActivity(`Validate failed: ${String(err?.message || err)}`);
    } finally {
      setStatus("idle");
    }
  }

  // Pipeline
  async function runPreEnrich() {
    setStatus("working");
    try {
      const res = await postJSON("/preenrich", {}); // your worker will build pre-enriched snapshot
      setPreEnrichOut(res);
      flash("success", "Pre-enrich complete");
      logActivity("Pre-enrich ✓");
    } catch (err: any) {
      setPreEnrichOut({ error: String(err?.message || err) });
      flash("error", "Pre-enrich failed");
      logActivity(`Pre-enrich failed: ${String(err?.message || err)}`);
    } finally {
      setStatus("idle");
    }
  }
  async function runGenerate() {
    setStatus("working");
    try {
      // If your worker expects pre-enrich JSON in body, pass preEnrichOut; adjust if not needed
      const res = await postJSON("/generate", preEnrichOut ?? {});
      setGenerateOut(res);
      flash("success", "Model generation complete");
      logActivity("Generate ✓");
    } catch (err: any) {
      setGenerateOut({ error: String(err?.message || err) });
      flash("error", "Generation failed");
      logActivity(`Generate failed: ${String(err?.message || err)}`);
    } finally {
      setStatus("idle");
    }
  }
  async function runAvatars() {
    setStatus("working");
    try {
      const res = await postJSON("/avatars", {});
      flash("success", "Avatars queued");
      logActivity(`Avatars ✓ ${res?.written?.length ?? 0} files`);
    } catch (err: any) {
      flash("error", "Avatars failed");
      logActivity(`Avatars failed: ${String(err?.message || err)}`);
    } finally {
      setStatus("idle");
    }
  }
  async function runPublish() {
    setStatus("working");
    try {
      const res = await postJSON("/publish", {});
      flash("success", "Published");
      logActivity("Publish ✓");
    } catch (err: any) {
      flash("error", "Publish failed");
      logActivity(`Publish failed: ${String(err?.message || err)}`);
    } finally {
      setStatus("idle");
    }
  }

  // Preview
  async function loadReport() {
    setStatus("working");
    try {
      const res = await getJSON("/report");
      setReport(res);
      flash("success", "Report loaded");
      logActivity("Report loaded ✓");
    } catch (err: any) {
      setReport({ error: String(err?.message || err) });
      flash("error", "Report not found");
      logActivity(`Report load failed: ${String(err?.message || err)}`);
    } finally {
      setStatus("idle");
    }
  }

  // UI bits
  const tabs: { key: TabKey; label: string }[] = [
    { key: "upload", label: "Upload" },
    { key: "validate", label: "Validate" },
    { key: "generate", label: "Generate" },
    { key: "preview", label: "Preview" },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-neutral-950/85 border-b border-neutral-800">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Bristol Bloods · Admin</h1>
            <p className="text-xs text-neutral-400">Draft ID: <span className="font-mono">{DRAFT_ID}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={status} />
          </div>
        </div>

        {/* Tabs */}
        <nav className="mx-auto max-w-6xl px-4">
          <ul className="flex gap-1">
            {tabs.map((t) => (
              <li key={t.key}>
                <button
                  onClick={() => setActive(t.key)}
                  className={classNames(
                    "px-3 py-2 rounded-lg text-sm font-medium transition",
                    active === t.key
                      ? "bg-neutral-800 text-white shadow-inner"
                      : "text-neutral-300 hover:text-white hover:bg-neutral-800/60"
                  )}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={classNames(
              "rounded-xl px-4 py-3 text-sm shadow-lg border",
              toast.type === "success"
                ? "bg-emerald-950/70 border-emerald-800 text-emerald-200"
                : "bg-rose-950/70 border-rose-800 text-rose-200"
            )}
          >
            {toast.msg}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 grid md:grid-cols-[1fr_320px] gap-6">
        <section className="space-y-6">
          {active === "upload" && (
            <Card title="Upload Inputs" subtitle="Master Eval CSV, Draft Results CSV, optional Keepers JSON.">
              <div className="grid sm:grid-cols-2 gap-4">
                <UploadTile
                  label="Master Eval CSV"
                  accept=".csv"
                  onFile={(f) => handleUploadMaster(f)}
                  stat={masterStat}
                />
                <UploadTile
                  label="Draft Results CSV"
                  accept=".csv"
                  onFile={(f) => handleUploadResults(f)}
                  stat={resultsStat}
                />
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Keepers JSON</h4>
                <textarea
                  className="w-full min-h-[140px] rounded-lg bg-neutral-900/70 border border-neutral-800 px-3 py-2 font-mono text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  placeholder='{"keepers":[{ "team":"...", "player":"...", "round":1, "pick":3 }]}'
                  value={keepersJson}
                  onChange={(e) => setKeepersJson(e.target.value)}
                />
                <div className="mt-2 flex items-center gap-3">
                  <button onClick={handleSaveKeepers} className="btn-primary">Save Keepers</button>
                  <p className="text-xs text-neutral-400">Paste from your config if you want the DO to lock keeper slots.</p>
                </div>
              </div>
            </Card>
          )}

          {active === "validate" && (
            <Card title="Run Validation" subtitle="Checks: files present, basic schema sanity, keeper slot map.">
              <div className="flex items-center gap-3">
                <button onClick={runValidate} className="btn-primary">Run</button>
              </div>
              <JsonPanel data={validateOut} />
              <SmallNotes>
                <li>Ensures both Master and Results are uploaded.</li>
                <li>If you see unmatched names in future steps, add aliases and re-run Pre-enrich.</li>
              </SmallNotes>
            </Card>
          )}

          {active === "generate" && (
            <Card title="Generation Pipeline" subtitle="Pre-enrich → Model → Avatars → Publish">
              <div className="grid sm:grid-cols-2 gap-3">
                <button onClick={runPreEnrich} className="btn-secondary">1) Run Pre-enrich</button>
                <button onClick={runGenerate} className="btn-secondary">2) Run Generate</button>
                <button onClick={runAvatars} className="btn-secondary">3) Generate Avatars</button>
                <button onClick={runPublish} className="btn-primary">4) Publish Report</button>
              </div>

              <section className="mt-6 grid gap-4">
                <SubCard title="Pre-enrich Output (summary)">
                  <JsonPanel data={summarizePre(preEnrichOut)} />
                </SubCard>
                <SubCard title="Model Response (truncated)">
                  <JsonPanel data={truncateJson(generateOut, 40_000)} />
                </SubCard>
              </section>
            </Card>
          )}

          {active === "preview" && (
            <Card title="Preview Published Report" subtitle="Fetches R2: bristol-bloods-2025/report.json">
              <div className="flex items-center gap-3">
                <button onClick={loadReport} className="btn-primary">Load Report</button>
              </div>

              {!report ? (
                <div className="mt-6 text-sm text-neutral-400">No report loaded yet.</div>
              ) : report?.error ? (
                <JsonPanel data={report} />
              ) : (
                <LeagueGrid data={report} />
              )}
            </Card>
          )}
        </section>

        {/* Activity */}
        <aside className="space-y-6">
          <Card title="Activity">
            <div className="rounded-lg bg-neutral-900/70 border border-neutral-800 p-3">
              <div className="h-[280px] overflow-auto font-mono text-xs leading-relaxed text-neutral-300">
                {activity.length === 0 ? (
                  <div className="text-neutral-500">No activity yet.</div>
                ) : (
                  <ul className="space-y-1">
                    {activity.map((line, i) => (
                      <li key={i} className="whitespace-pre">{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>

          <Card title="Links">
            <ul className="text-sm text-neutral-300 space-y-2">
              <li><a className="hover:text-white underline/50" href={`${API_BASE || ""}/draft/${DRAFT_ID}/health`.replace("//draft","/draft")} target="_blank">/health</a></li>
              <li><a className="hover:text-white underline/50" href={`${API_BASE || ""}/draft/${DRAFT_ID}/report`.replace("//draft","/draft")} target="_blank">/report (R2)</a></li>
            </ul>
          </Card>
        </aside>
      </main>
    </div>
  );
}

/* ---------- Small components ---------- */

function StatusPill({ status }: { status: "idle" | "working" | "done" | "error" }) {
  const map = {
    idle: { text: "idle", cls: "bg-neutral-800 text-neutral-300 border-neutral-700" },
    working: { text: "working…", cls: "bg-amber-900/60 text-amber-200 border-amber-800" },
    done: { text: "done", cls: "bg-emerald-900/60 text-emerald-200 border-emerald-800" },
    error: { text: "error", cls: "bg-rose-900/60 text-rose-200 border-rose-800" },
  } as const;
  const m = map[status];
  return <span className={classNames("text-xs px-2.5 py-1 rounded-full border", m.cls)}>{m.text}</span>;
}

function Card(props: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-sm">
      <header className="mb-4">
        <h2 className="text-lg font-semibold leading-tight">{props.title}</h2>
        {props.subtitle && <p className="text-sm text-neutral-400 mt-1">{props.subtitle}</p>}
      </header>
      {props.children}
    </section>
  );
}

function SubCard(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
      <h3 className="text-sm font-medium text-neutral-300 mb-3">{props.title}</h3>
      {props.children}
    </div>
  );
}

function UploadTile({
  label, accept, onFile, stat,
}: { label: string; accept: string; onFile: (f: File) => void; stat: UploadStat | null }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className={classNames(
        "group rounded-xl border border-neutral-800 bg-neutral-950/40 p-4 transition",
        hover && "border-neutral-700 bg-neutral-900/40"
      )}
      onDragOver={(e) => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-neutral-400">Drop file or click to choose</div>
        </div>
        <span className="text-[10px] text-neutral-400 uppercase border border-neutral-700 rounded px-1.5 py-0.5">{accept}</span>
      </div>

      <label className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 cursor-pointer">
        <input type="file" className="hidden" accept={accept} onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }} />
        Upload…
      </label>

      {stat && (
        <div className="mt-3 text-xs text-neutral-300">
          <div className={classNames(stat.ok ? "text-emerald-300" : "text-rose-300")}>
            {stat.label}{stat.ok ? " ✓" : " ✕"}
          </div>
          {stat.detail && <div className="text-neutral-400">{stat.detail}</div>}
        </div>
      )}
    </div>
  );
}

function SmallNotes({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-lg bg-neutral-950/40 border border-neutral-800 p-3">
      <h4 className="text-xs font-semibold text-neutral-300 mb-1">Notes</h4>
      <ul className="list-disc ml-5 space-y-1 text-sm text-neutral-400">{children}</ul>
    </div>
  );
}

function JsonPanel({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="mt-5">
      <pre className="max-h-[420px] overflow-auto rounded-lg border border-neutral-800 bg-neutral-950/70 p-3 text-xs leading-relaxed text-neutral-200">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function summarizePre(pre: any) {
  if (!pre) return null;
  const s = pre?.summary || pre?.joins || pre?.schema || pre;
  return s;
}
function truncateJson(j: any, max = 20000) {
  if (!j) return null;
  const s = JSON.stringify(j, null, 2);
  return s.length > max ? JSON.parse(s.slice(0, max)) : j;
}

function LeagueGrid({ data }: { data: any }) {
  const teams: any[] = data?.teams || data?.modelOutput?.teams || [];
  if (!Array.isArray(teams) || teams.length === 0) {
    return <div className="mt-4 text-sm text-neutral-400">No teams in report.</div>;
  }
  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {teams.map((t, i) => {
        const grade = (t.grade || t.letter || "").replace("+", "p").replace("-", "m");
        return (
          <div key={i} className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900/50">
            <div className="aspect-[16/9] bg-neutral-800/60 flex items-center justify-center">
              {t.cardUrl ? (
                <img src={t.cardUrl} alt={t.teamName} className="w-full h-full object-cover" />
              ) : (
                <div className="text-neutral-400 text-sm">No image</div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold">{t.teamName || t.name}</h4>
                <span className={classNames(
                  "text-xs font-semibold px-2.5 py-1 rounded-full",
                  grade.startsWith("A") ? "bg-emerald-700/30 text-emerald-200 border border-emerald-700/50" :
                  grade.startsWith("B") ? "bg-sky-700/30 text-sky-200 border border-sky-700/50" :
                  grade.startsWith("C") ? "bg-amber-700/30 text-amber-200 border border-amber-700/50" :
                  "bg-rose-800/30 text-rose-200 border border-rose-800/50"
                )}>
                  {t.grade || t.letter || "—"}
                </span>
              </div>
              <p className="text-xs text-neutral-400 line-clamp-3">{t.summary || t.summaryShort || "—"}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

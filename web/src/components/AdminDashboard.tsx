import React, { useEffect, useMemo, useState } from "react";

/** CONFIG
 * If you mapped /draft/* on the Pages host -> Worker, keep API_BASE = "" (same-origin).
 * Otherwise set to your Worker domain (and keep CORS enabled there).
 */
const API_BASE = "https://api.bristolbloods.com"; // e.g. "https://api.bristolbloods.com"
const DRAFT_ID = "2025-bristol-bloods";

type TabKey = "upload" | "validate" | "generate" | "preview";
type Jsonish = any;
type UploadStat = { label: string; ok?: boolean; detail?: string; ts?: number };

function cx(...xs: (string | undefined | null | false)[]) {
  return xs.filter(Boolean).join(" ");
}

/* ----------------------------- API helpers ----------------------------- */
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
  const res = await fetch(`${API_BASE}/draft/${DRAFT_ID}${path}`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function getJSON<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/draft/${DRAFT_ID}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ----------------------------- Root Component ----------------------------- */
export default function AdminDashboard() {
  const [active, setActive] = useState<TabKey>("upload");
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [masterStat, setMasterStat] = useState<UploadStat | null>(null);
  const [resultsStat, setResultsStat] = useState<UploadStat | null>(null);
  const [keepersJson, setKeepersJson] = useState<string>("");

  const [validateOut, setValidateOut] = useState<Jsonish | null>(null);
  const [preEnrichOut, setPreEnrichOut] = useState<Jsonish | null>(null);
  const [generateOut, setGenerateOut] = useState<Jsonish | null>(null);
  const [report, setReport] = useState<Jsonish | null>(null);

  const [activity, setActivity] = useState<string[]>([]);
  const [hoverHelp, setHoverHelp] = useState<string | null>(null);

  function log(line: string) {
    const ts = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setActivity((a) => [`${ts} • ${line}`, ...a].slice(0, 200));
  }
  function flash(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  /* ----------------------------- Actions ----------------------------- */
  async function handleUploadMaster(file: File) {
    setStatus("working");
    try {
      const res = await postFile("/upload-master", file);
      setMasterStat({ label: "Master uploaded", ok: true, detail: `bytes: ${res.bytes ?? "?"}`, ts: Date.now() });
      log("Master uploaded");
      flash("success", "Master CSV uploaded");
    } catch (e: any) {
      setMasterStat({ label: "Master upload failed", ok: false, detail: e?.message, ts: Date.now() });
      log(`Master upload failed`);
      flash("error", "Failed to upload master");
    } finally { setStatus("idle"); }
  }
  async function handleUploadResults(file: File) {
    setStatus("working");
    try {
      const res = await postFile("/upload-results", file);
      setResultsStat({ label: "Results uploaded", ok: true, detail: `bytes: ${res.bytes ?? "?"}`, ts: Date.now() });
      log("Results uploaded");
      flash("success", "Draft results uploaded");
    } catch (e: any) {
      setResultsStat({ label: "Results upload failed", ok: false, detail: e?.message, ts: Date.now() });
      log("Results upload failed");
      flash("error", "Failed to upload results");
    } finally { setStatus("idle"); }
  }
  async function handleSaveKeepers() {
    setStatus("working");
    try {
      const parsed = JSON.parse(keepersJson || "{}");
      await postJSON("/keepers", { keepers: parsed?.keepers ?? [] });
      log(`Keepers saved`);
      flash("success", "Keepers JSON saved");
    } catch (e: any) {
      log("Keepers save failed");
      flash("error", "Invalid JSON or network error");
    } finally { setStatus("idle"); }
  }

  async function runValidate() {
    setStatus("working");
    try {
      const res = await postJSON("/validate");
      setValidateOut(res);
      flash("success", "Validation OK");
      log("Validation passed");
    } catch (e: any) {
      setValidateOut({ error: String(e?.message || e) });
      flash("error", "Validation failed");
      log("Validation failed");
    } finally { setStatus("idle"); }
  }
  async function runPreEnrich() {
    setStatus("working");
    try {
      const res = await postJSON("/preenrich", {});
      setPreEnrichOut(res);
      flash("success", "Pre-enrich complete");
      log("Pre-enrich complete");
    } catch (e: any) {
      setPreEnrichOut({ error: String(e?.message || e) });
      flash("error", "Pre-enrich failed");
      log("Pre-enrich failed");
    } finally { setStatus("idle"); }
  }
  async function runGenerate() {
    setStatus("working");
    try {
      const res = await postJSON("/generate", preEnrichOut ?? {});
      setGenerateOut(res);
      flash("success", "Model output saved");
      log("Generate finished");
    } catch (e: any) {
      setGenerateOut({ error: String(e?.message || e) });
      flash("error", "Generate failed");
      log("Generate failed");
    } finally { setStatus("idle"); }
  }
  async function runAvatars() {
    setStatus("working");
    try {
      const res = await postJSON("/avatars", {});
      flash("success", "Avatar jobs queued");
      log(`Avatars enqueued`);
    } catch { flash("error", "Avatar generation failed"); log("Avatars failed"); }
    finally { setStatus("idle"); }
  }
  async function runPublish() {
    setStatus("working");
    try {
      await postJSON("/publish", {});
      flash("success", "Published to R2");
      log("Published report.json");
    } catch { flash("error", "Publish failed"); log("Publish failed"); }
    finally { setStatus("idle"); }
  }
  async function loadReport() {
    setStatus("working");
    try {
      const res = await getJSON("/report");
      setReport(res);
      flash("success", "Report loaded");
      log("Loaded report.json");
    } catch (e: any) {
      setReport({ error: String(e?.message || e) });
      flash("error", "No report found");
      log("Report fetch failed");
    } finally { setStatus("idle"); }
  }

  /* ----------------------------- Layout ----------------------------- */
  const tabs: { key: TabKey; label: string; desc: string }[] = [
    { key: "upload",   label: "Upload",   desc: "Provide master, draft results & optional keepers" },
    { key: "validate", label: "Validate", desc: "Sanity checks & keeper slots" },
    { key: "generate", label: "Generate", desc: "Pre-enrich → LLM → Avatars → Publish" },
    { key: "preview",  label: "Preview",  desc: "View published report.json" },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/85 backdrop-blur border-b border-neutral-800">
        <div className="mx-auto max-w-7xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-500/20 grid place-items-center">
              <Logo />
            </div>
            <div>
              <div className="text-sm uppercase tracking-widest text-neutral-400">Admin</div>
              <div className="text-lg font-semibold -mt-0.5">Bristol Bloods</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400 hidden sm:inline">Draft:</span>
            <span className="px-2.5 py-1 rounded-full text-xs bg-neutral-800 border border-neutral-700 font-mono">{DRAFT_ID}</span>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-7xl px-5 pb-3 overflow-x-auto">
          <div className="inline-flex gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                onMouseEnter={() => setHoverHelp(t.desc)}
                onMouseLeave={() => setHoverHelp(null)}
                className={cx(
                  "px-3.5 py-2 rounded-lg text-sm transition border",
                  active === t.key
                    ? "bg-neutral-800 border-neutral-700 text-white shadow-inner"
                    : "bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800/60 text-neutral-300"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          {hoverHelp && <div className="text-xs text-neutral-400 mt-2">{hoverHelp}</div>}
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className={cx(
            "rounded-xl px-4 py-3 text-sm shadow-xl border",
            toast.type === "success"
              ? "bg-emerald-950/80 border-emerald-800 text-emerald-200"
              : "bg-rose-950/80 border-rose-800 text-rose-200"
          )}>
            {toast.msg}
          </div>
        </div>
      )}

      {/* Main two-column layout */}
      <main className="mx-auto max-w-7xl px-5 py-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-7">
        <section className="space-y-7">
          {active === "upload" && (
            <Card title="Upload Inputs" subtitle="Upload your ADP+Projections master and 20-round draft results. Optionally paste keepers JSON.">
              <div className="grid md:grid-cols-2 gap-5">
                <Uploader
                  title="Master Eval CSV"
                  description="ADP + Projections (Value, Scarcity, Risk)"
                  accept=".csv"
                  stat={masterStat}
                  onFile={handleUploadMaster}
                />
                <Uploader
                  title="Draft Results CSV"
                  description="20 rounds from ESPN (Round, Pick, Player, Team, Pos, Fantasy Team)"
                  accept=".csv"
                  stat={resultsStat}
                  onFile={handleUploadResults}
                />
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-2">Keepers JSON <span className="text-neutral-400 font-normal">(optional)</span></h4>
                <textarea
                  className="w-full min-h-[160px] rounded-xl bg-neutral-900/70 border border-neutral-800 px-3 py-2 font-mono text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  placeholder='{"keepers":[{"team":"PROJECT BADASS","player":"Bijan Robinson","pos":"RB","round":1,"pick":4}]}'
                  value={keepersJson}
                  onChange={(e) => setKeepersJson(e.target.value)}
                />
                <div className="mt-2 flex items-center gap-3">
                  <button onClick={handleSaveKeepers} className="btn-primary">Save keepers</button>
                  <span className="text-xs text-neutral-400">Locks player/round/pick; also persisted to R2 for audit.</span>
                </div>
              </div>
            </Card>
          )}

          {active === "validate" && (
            <Card title="Validation" subtitle="Verifies uploads exist, keeper slots map cleanly, and basic sanity checks.">
              <div className="flex items-center gap-3">
                <button onClick={runValidate} className="btn-primary">Run validation</button>
              </div>
              <JsonBlock data={validateOut} />
              <HintList items={[
                "Both Master and Results must be present.",
                "If you see unmatched players in later steps, add aliases and rerun Pre-enrich.",
              ]}/>
            </Card>
          )}

          {active === "generate" && (
            <Card title="Generation Pipeline" subtitle="Recommended order: Pre-enrich → Generate → Avatars → Publish.">
              <div className="grid md:grid-cols-2 gap-3">
                <button onClick={runPreEnrich} className="btn-secondary">1) Run Pre-enrich</button>
                <button onClick={runGenerate} className="btn-secondary">2) Run Generate (LLM)</button>
                <button onClick={runAvatars} className="btn-secondary">3) Generate Avatars</button>
                <button onClick={runPublish} className="btn-primary">4) Publish Report</button>
              </div>

              <div className="mt-6 grid gap-5">
                <SubCard title="Pre-enrich summary">
                  <JsonBlock data={summarizePre(preEnrichOut)} />
                </SubCard>
                <SubCard title="Model output (truncated)">
                  <JsonBlock data={truncateJson(generateOut, 40_000)} />
                </SubCard>
              </div>
            </Card>
          )}

          {active === "preview" && (
            <Card title="Preview Published Report" subtitle="Reads bristol-bloods-2025/report.json from R2.">
              <div className="flex items-center gap-3">
                <button onClick={loadReport} className="btn-primary">Load report</button>
                {report?.teams?.length && (
                  <span className="text-xs text-neutral-400">{report.teams.length} teams</span>
                )}
              </div>
              {!report ? (
                <EmptyState title="No report loaded" subtitle="Click “Load report” to fetch the latest publish."/>
              ) : report?.error ? (
                <JsonBlock data={report} />
              ) : (
                <LeagueGrid data={report} />
              )}
            </Card>
          )}
        </section>

        <aside className="space-y-7">
          <Card title="Activity">
            <div className="rounded-xl bg-neutral-900/70 border border-neutral-800 p-3">
              <div className="h-[280px] overflow-auto font-mono text-xs leading-relaxed text-neutral-300">
                {activity.length === 0 ? <div className="text-neutral-500">No activity yet.</div> : (
                  <ul className="space-y-1">{activity.map((l, i) => <li className="whitespace-pre" key={i}>{l}</li>)}</ul>
                )}
              </div>
            </div>
          </Card>

          <Card title="Quick links">
            <ul className="text-sm text-neutral-300 space-y-2">
              <li><a className="link" href={`${API_BASE || ""}/draft/${DRAFT_ID}/health`.replace("//draft","/draft")} target="_blank">/health</a></li>
              <li><a className="link" href={`${API_BASE || ""}/draft/${DRAFT_ID}/report`.replace("//draft","/draft")} target="_blank">/report.json</a></li>
            </ul>
          </Card>
        </aside>
      </main>
    </div>
  );
}

/* ----------------------------- UI atoms ----------------------------- */

function Logo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="text-indigo-300">
      <path fill="currentColor" d="M12 2a10 10 0 0 0-9.95 9h3.07A7 7 0 1 1 12 19.95V23A11 11 0 1 0 1 12h3.05A8 8 0 1 1 12 20.95V23h0z"/>
    </svg>
  );
}

function StatusBadge({ status }: { status: "idle" | "working" | "done" | "error" }) {
  const map = {
    idle:    { t: "Idle",    c: "bg-neutral-800 border-neutral-700 text-neutral-300" },
    working: { t: "Working", c: "bg-amber-900/50 border-amber-800 text-amber-200" },
    done:    { t: "Done",    c: "bg-emerald-900/50 border-emerald-800 text-emerald-200" },
    error:   { t: "Error",   c: "bg-rose-900/50 border-rose-800 text-rose-200" },
  } as const;
  const m = map[status];
  return <span className={cx("px-2.5 py-1 rounded-full text-xs border", m.c)}>{m.t}</span>;
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 shadow-lg shadow-black/20">
      <header className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-neutral-400 mt-1">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function SubCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
      <h3 className="text-sm font-semibold text-neutral-300 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function HintList({ items }: { items: string[] }) {
  return (
    <div className="mt-5 rounded-xl bg-neutral-950/40 border border-neutral-800 p-4">
      <ul className="list-disc ml-5 space-y-1 text-sm text-neutral-400">
        {items.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-6 grid place-items-center text-center">
      <div className="space-y-2">
        <div className="mx-auto h-10 w-10 rounded-full bg-neutral-800 grid place-items-center">
          <svg width="18" height="18" viewBox="0 0 24 24" className="text-neutral-300"><path fill="currentColor" d="M19 19H5V8h14m0-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2M11 10h2v6h-2v-6Z"/></svg>
        </div>
        <h4 className="font-semibold">{title}</h4>
        {subtitle && <p className="text-sm text-neutral-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function JsonBlock({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="mt-5">
      <pre className="max-h-[420px] overflow-auto rounded-xl border border-neutral-800 bg-neutral-950/70 p-3 text-xs leading-relaxed text-neutral-200">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function Uploader({
  title, description, accept, stat, onFile,
}: { title: string; description: string; accept: string; stat: UploadStat | null; onFile: (f: File) => void }) {
  const [drag, setDrag] = useState(false);

  return (
    <div className={cx(
      "rounded-xl border p-4 transition shadow-sm",
      drag ? "border-indigo-600 bg-indigo-500/5" : "border-neutral-800 bg-neutral-950/40"
    )}>
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-neutral-800 grid place-items-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" className="text-neutral-300">
            <path fill="currentColor" d="M19 20H5a2 2 0 0 1-2-2V8l6-5h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2M5 8h14V5H9.5L5 8Z"/>
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">{title}</h4>
            <span className="text-[10px] text-neutral-400 uppercase border border-neutral-700 rounded px-1.5 py-0.5">{accept}</span>
          </div>
          <p className="text-sm text-neutral-400 mt-1">{description}</p>

          <label
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files?.[0];
              if (f) onFile(f);
            }}
            className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-700/70 bg-neutral-900/60 hover:bg-neutral-900 cursor-pointer px-3 py-6 transition"
          >
            <input type="file" className="hidden" accept={accept} onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}/>
            <svg width="16" height="16" viewBox="0 0 24 24" className="text-neutral-300">
              <path fill="currentColor" d="M12 16V8m0 0l-3 3m3-3l3 3M5 19h14a2 2 0 0 0 2-2v-2a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v2a2 2 0 0 0 2 2Z"/>
            </svg>
            <span className="text-sm text-neutral-300">Drop file or <span className="underline/50">choose</span></span>
          </label>

          {stat && (
            <div className="mt-3 text-xs">
              <div className={cx(stat.ok ? "text-emerald-300" : "text-rose-300")}>
                {stat.label}{stat.ok ? " ✓" : " ✕"}
              </div>
              {stat.detail && <div className="text-neutral-400">{stat.detail}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeagueGrid({ data }: { data: any }) {
  // The published shape is { version, draftId, generatedAt, teams: [...] }
  const generatedAt: string | undefined = data?.generatedAt;
  const teams: any[] = data?.teams || data?.modelOutput?.teams || [];
  if (!Array.isArray(teams) || teams.length === 0) {
    return <EmptyState title="No teams in report" />;
  }

  return (
    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {teams.map((t, i) => {
        const teamName = t.team || t.teamName || t.name || "—";
        const letter: string =
          (t.grades?.overall as string) ||
          (t.grade as string) ||
          (t.letter as string) ||
          "–";

        const badge = (letter || "–")[0];
        const tone =
          badge === "A" ? "bg-emerald-700/25 text-emerald-200 border-emerald-800/60" :
          badge === "B" ? "bg-sky-700/25 text-sky-200 border-sky-800/60" :
          badge === "C" ? "bg-amber-700/25 text-amber-200 border-amber-800/60" :
          "bg-rose-800/30 text-rose-200 border-rose-900/60";

        const summary =
          t.verdict ||
          t.summary ||
          (t.strengths && t.weaknesses
            ? `+ ${t.strengths} · – ${t.weaknesses}`
            : t.strengths || t.weaknesses || "—");

        const src = reportCardUrl(teamName, generatedAt);

        return (
          <div key={i} className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 transition">
            <div className="aspect-[16/9] bg-neutral-800/50">
              <img
                src={src}
                alt={teamName}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = IMG_FALLBACK;
                }}
              />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{teamName}</h4>
                  {/* Keep owner/firstName if you ever add it */}
                  {t.owner || t.firstName ? (
                    <p className="text-xs text-neutral-400">
                      {t.owner || t.firstName}
                    </p>
                  ) : null}
                </div>
                <span className={cx("px-2.5 py-1 rounded-full text-xs border font-semibold", tone)}>
                  {letter}
                </span>
              </div>
              <p className="text-sm text-neutral-300 mt-2 line-clamp-3">{summary}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------- Utility ----------------------------- */
function summarizePre(pre: any) {
  if (!pre) return null;
  return pre.summary ?? pre.joins ?? pre.schema ?? pre;
}
function truncateJson(j: any, max = 20000) {
  if (!j) return null;
  const s = JSON.stringify(j, null, 2);
  return s.length > max ? JSON.parse(s.slice(0, max)) : j;
}

/* ----------------------------- Shared buttons (Tailwind) ----------------------------- */
/* Tailwind v4: these classes are just reused utility strings */
const btnBase = "inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition";
const ring = "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40";
const border = "border border-neutral-700";

function ButtonBase({ className, children, ...props }: any) {
  return <button className={cx(btnBase, ring, className)} {...props}>{children}</button>;
}

function Btn({ tone="neutral", ...p }: any) {
  if (tone === "primary") return <ButtonBase {...p} className={cx(border, "bg-indigo-600/90 hover:bg-indigo-600 text-white", p.className)} />;
  if (tone === "secondary") return <ButtonBase {...p} className={cx(border, "bg-neutral-800 hover:bg-neutral-700 text-neutral-100", p.className)} />;
  return <ButtonBase {...p} className={cx(border, "bg-neutral-900 hover:bg-neutral-800 text-neutral-100", p.className)} />;
}

/* semantic aliases */
function Button(props: any) { return <Btn {...props}/>; }
const Primary = (props: any) => <Button tone="primary" {...props} />;
const Secondary = (props: any) => <Button tone="secondary" {...props} />;

/* exposed classNames for inline use */
Object.assign(globalThis, {
  // provide classnames for buttons in JSX above without extra imports
});
/* convenience wrappers */
const btnPrimary = "inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-indigo-600/90 hover:bg-indigo-600 text-white border border-indigo-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40";
const btnSecondary = "inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40";

/* For brevity in JSX above */
function ButtonText() { return null; }

// --- image helpers (add near API helpers) ---
const teamSlug = (s: string) =>
  (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const reportCardUrl = (team: string, generatedAt?: string) =>
  `/report-card/${teamSlug(team)}.jpg${
    generatedAt ? `?v=${encodeURIComponent(generatedAt)}` : ""
  }`;

const IMG_FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1024' height='1024'>
      <rect width='100%' height='100%' fill='#141414'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
            font-family='system-ui,-apple-system,Segoe UI,Roboto' font-size='24' fill='#777'>
        No card image
      </text>
    </svg>`
  );

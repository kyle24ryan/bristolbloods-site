import React, { useEffect, useState } from "react";

/**
 * Bristol Bloods – Admin Dashboard (single-file React component)
 *
 * Tabs:
 *  - Upload (master eval, results, keepers)
 *  - Validate (schema presence)
 *  - Generate (Pre-enrich → Generate → Avatars → Publish)
 *  - Preview (league grid using published report.json if present)
 *
 * Assumes your Worker routes:
 *   POST /draft/:id/upload-master (multipart: file)
 *   POST /draft/:id/upload-results (multipart: file)
 *   POST /draft/:id/keepers (json: { keepers: [...] })
 *   POST /draft/:id/validate
 *   POST /draft/:id/preenrich
 *   POST /draft/:id/generate
 *   POST /draft/:id/avatars
 *   POST /draft/:id/publish
 *   GET  /draft/:id/report (reads R2/report.json)
 */

const DRAFT_ID = "2025-bristol-bloods";
const API_BASE = "https://api.bristolbloods.com"; // same-origin; change if you host API separately

export default function AdminDashboard() {
  const [tab, setTab] = useState<TabKey>("upload");
  const [busy, setBusy] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const [masterFile, setMasterFile] = useState<File | null>(null);
  const [resultsFile, setResultsFile] = useState<File | null>(null);
  const [keepersText, setKeepersText] = useState<string>("");

  const [validateStatus, setValidateStatus] = useState<any>(null);
  const [preenrich, setPreenrich] = useState<any>(null);
  const [modelOutput, setModelOutput] = useState<any>(null);
  const [publishPreview, setPublishPreview] = useState<any>(null);

  function log(line: string) { setLogs((l) => [ts() + "  " + line, ...l].slice(0, 200)); }

  // -------------- API helpers
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

  // -------------- Upload handlers
  const doUploadMaster = async () => {
    if (!masterFile) return alert("Choose master_eval_2025.csv");
    setBusy("Uploading Master Eval…");
    try {
      const out = await postFile("/upload-master", masterFile);
      log(`Master uploaded ✓ rows/bytes: ${out.rows ?? out.bytes ?? "?"}`);
    } catch (e: any) { log(`Master upload failed: ${safeErr(e)}`); } finally { setBusy(null); }
  };
  const doUploadResults = async () => {
    if (!resultsFile) return alert("Choose draft_results.csv");
    setBusy("Uploading Draft Results…");
    try {
      const out = await postFile("/upload-results", resultsFile);
      log(`Results uploaded ✓ rows/bytes: ${out.rows ?? out.bytes ?? "?"}`);
    } catch (e: any) { log(`Results upload failed: ${safeErr(e)}`); } finally { setBusy(null); }
  };
  const doUploadKeepers = async () => {
    if (!keepersText.trim()) return alert("Paste keepers JSON");
    setBusy("Saving Keepers…");
    try {
      const json = JSON.parse(keepersText);
      const out = await postJSON("/keepers", json);
      log(`Keepers saved ✓ count: ${out.count ?? "?"}`);
    } catch (e: any) { log(`Keepers save failed: ${safeErr(e)}`); } finally { setBusy(null); }
  };

  // -------------- Validate
  const doValidate = async () => {
    setBusy("Validating…");
    try {
      const out = await postJSON("/validate");
      setValidateStatus(out);
      log(`Validate ✓ master=${out.schema?.masterEval} results=${out.schema?.draftResults}`);
    } catch (e: any) { log(`Validate failed: ${safeErr(e)}`); } finally { setBusy(null); }
  };

  // -------------- Pipeline steps
  const doPreenrich = async () => {
    setBusy("Pre-enrich running…");
    try {
      const out = await postJSON("/preenrich");
      setPreenrich(out);
      log(`Pre-enrich ✓ teams=${out.summary?.teams} unmatched=${out.summary?.unmatched}`);
    } catch (e: any) { log(`Pre-enrich failed: ${safeErr(e)}`); } finally { setBusy(null); }
  };
  const doGenerate = async () => {
    setBusy("Generating narratives…");
    try {
      const out = await postJSON("/generate");
      setModelOutput(out.modelOutput ?? out);
      log(`Generate ✓ validated=${out.validated ?? "?"}`);
    } catch (e: any) { log(`Generate failed: ${safeErr(e)}`); } finally { setBusy(null); }
  };
  const doAvatars = async () => {
    setBusy("Generating portraits…");
    try {
      const out = await postJSON("/avatars");
      log(`Avatars ✓ written=${out.written?.length ?? 0} missing=${out.missingPersonas?.length ?? 0}`);
    } catch (e: any) { log(`Avatars failed: ${safeErr(e)}`); } finally { setBusy(null); }
  };
  const doPublish = async () => {
    setBusy("Publishing…");
    try {
      const out = await postJSON("/publish");
      setPublishPreview(out);
      log(`Publish ✓ ${out.reportKey}`);
    } catch (e: any) { log(`Publish failed: ${safeErr(e)}`); } finally { setBusy(null); }
  };

  // -------------- Preview: try fetch published report.json
  const [report, setReport] = useState<any>(null);
  const [reportErr, setReportErr] = useState<string | null>(null);
  const loadReport = async () => {
    setReportErr(null);
    try {
      const r = await getJSON(`/report`);
      setReport(r);
      log("Loaded published report.json ✓");
    } catch (e: any) {
      setReport(null);
      setReportErr("Not published yet (404) or fetch error");
    }
  };

  useEffect(() => { if (tab === "preview") loadReport(); }, [tab]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4">
      <header className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold">Bristol Bloods · Admin</h1>
        <div className="text-sm opacity-80">Draft ID: <code>{DRAFT_ID}</code></div>
      </header>

      <nav className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-2 rounded-md border ${tab===t.key?"bg-neutral-800 border-neutral-700":"bg-neutral-900 border-neutral-800 hover:bg-neutral-800"}`}>
            {t.label}
          </button>
        ))}
        <div className="ml-auto text-sm px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800">
          {busy ? <span className="animate-pulse">{busy}</span> : "idle"}
        </div>
      </nav>

      {tab === "upload" && (
        <section className="grid gap-6 md:grid-cols-3">
          <Card title="Master Eval CSV">
            <input type="file" accept=".csv" onChange={(e)=>setMasterFile(e.target.files?.[0]||null)} />
            <div className="h-2"/>
            <button className="btn" onClick={doUploadMaster}>Upload master_eval_2025.csv</button>
            <p className="hint">ADP + Projections master file with Value/Scarcity/Risk columns.</p>
          </Card>
          <Card title="Draft Results CSV">
            <input type="file" accept=".csv" onChange={(e)=>setResultsFile(e.target.files?.[0]||null)} />
            <div className="h-2"/>
            <button className="btn" onClick={doUploadResults}>Upload draft_results.csv</button>
            <p className="hint">20-round results from ESPN (Round, Pick, Overall, Player, NFL Team, Pos, Fantasy Team).</p>
          </Card>
          <Card title="Keepers JSON">
            <textarea className="area" rows={10} placeholder='{"keepers":[{"team":"PROJECT BADASS","player":"Bijan Robinson","pos":"RB","round":1,"pick":4}]}' value={keepersText} onChange={e=>setKeepersText(e.target.value)} />
            <button className="btn" onClick={doUploadKeepers}>Save keepers</button>
            <p className="hint">Locked player/round/pick mapping. Persisted to R2 for audit.</p>
          </Card>
        </section>
      )}

      {tab === "validate" && (
        <section className="grid gap-6 md:grid-cols-2">
          <Card title="Run Validation">
            <button className="btn" onClick={doValidate}>Run</button>
            <div className="mt-4">
              <pre className="pre">{JSON.stringify(validateStatus, null, 2) || "(none)"}</pre>
            </div>
          </Card>
          <Card title="Notes">
            <ul className="list-disc pl-5 space-y-1 text-sm opacity-90">
              <li>Checks that both Master and Results are uploaded.</li>
              <li>For unmatched players, you can add aliases later (optional).</li>
            </ul>
          </Card>
        </section>
      )}

      {tab === "generate" && (
        <section className="grid gap-6 md:grid-cols-2">
          <Card title="1) Pre-enrich">
            <button className="btn" onClick={doPreenrich}>Run pre-enrich</button>
            <pre className="pre mt-3">{preenrich ? JSON.stringify(preenrich.summary, null, 2) : "(no run)"}</pre>
          </Card>
          <Card title="2) Generate narrative">
            <button className="btn" onClick={doGenerate}>Run generate</button>
            <pre className="pre mt-3">{modelOutput ? JSON.stringify({ teams: modelOutput.teams?.length, awards: !!modelOutput.leagueAwards }, null, 2) : "(no run)"}</pre>
          </Card>
          <Card title="3) Avatars">
            <button className="btn" onClick={doAvatars}>Generate portraits</button>
            <p className="hint mt-2">Portraits saved to R2 under <code>cards/report/*.jpg</code>.</p>
          </Card>
          <Card title="4) Publish">
            <button className="btn" onClick={doPublish}>Publish report</button>
            <pre className="pre mt-3">{publishPreview ? JSON.stringify(publishPreview, null, 2) : "(no run)"}</pre>
          </Card>
        </section>
      )}

      {tab === "preview" && (
        <section className="grid gap-6">
          <div className="flex items-center gap-3">
            <button className="btn" onClick={loadReport}>Reload report.json</button>
            {reportErr && <span className="text-amber-400 text-sm">{reportErr}</span>}
          </div>

          {report && <LeagueGrid report={report} />}
        </section>
      )}

      <section className="mt-8">
        <h3 className="text-sm font-semibold mb-2 opacity-80">Activity</h3>
        <div className="pre h-48 overflow-auto">{logs.join("\n")}</div>
      </section>

      <style>{`
        .btn { background:#111827; border:1px solid #1f2937; padding:.5rem .75rem; border-radius:.5rem; }
        .btn:hover { background:#0b1220; }
        .hint { color:#9ca3af; font-size:.85rem; margin-top:.5rem; }
        .pre { background:#0b0f19; border:1px solid #1f2937; padding:.75rem; border-radius:.5rem; font-size:.85rem; white-space:pre-wrap; }
        .area { width:100%; background:#0b0f19; border:1px solid #1f2937; padding:.5rem; border-radius:.5rem; color:#e5e7eb; }
      `}</style>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <h2 className="text-lg font-medium mb-3">{title}</h2>
      {children}
    </div>
  );
}

function LeagueGrid({ report }: { report: any }) {
  const teams = report?.teams || [];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {teams.map((t: any) => (
        <article key={t.team} className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
          <img src={cardUrl(t.team)} alt={t.team} className="w-full aspect-square object-cover" />
          <div className="p-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{t.team}</h3>
              <p className="text-sm opacity-80">{t.verdict || ""}</p>
            </div>
            <span className={`grade-${(t.overallGrade||t.grades?.overall||"C").replace("+","p").replace("-","m")}`}>{t.overallGrade || t.grades?.overall}</span>
          </div>
          <style>{`
            .grade-A, .grade-Ap, .grade-Am { background:#065f46; }
            .grade-B, .grade-Bp, .grade-Bm { background:#1d4ed8; }
            .grade-C, .grade-Cp, .grade-Cm { background:#92400e; }
            .grade-D, .grade-Dp, .grade-Dm, .grade-F { background:#7f1d1d; }
            .grade-A, .grade-Ap, .grade-Am, .grade-B, .grade-Bp, .grade-Bm, .grade-C, .grade-Cp, .grade-Cm, .grade-D, .grade-Dp, .grade-Dm, .grade-F {
              color:#fff; padding:.25rem .5rem; border-radius:.375rem; font-weight:600; font-size:.9rem;
            }
          `}</style>
        </article>
      ))}
    </div>
  );
}

// ---------- utils
function ts(){ return new Date().toLocaleTimeString(); }
function safeErr(e:any){ try{ const o=JSON.parse(String(e?.message||e)); return o?.errors?.[0]?.message || e; } catch { return String(e?.message||e); } }
function cardUrl(teamName: string){
  const slug = teamName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `/${"bristol-bloods-2025"}/cards/report/${slug}.jpg`;
}

type TabKey = "upload" | "validate" | "generate" | "preview";
const TABS: { key: TabKey; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "validate", label: "Validate" },
  { key: "generate", label: "Generate" },
  { key: "preview", label: "Preview" },
];

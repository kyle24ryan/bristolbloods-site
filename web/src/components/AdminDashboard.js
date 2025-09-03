import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
/** CONFIG
 * If you mapped /draft/* on the Pages host -> Worker, keep API_BASE = "" (same-origin).
 * Otherwise set to your Worker domain (and keep CORS enabled there).
 */
const API_BASE = "https://api.bristolbloods.com"; // e.g. "https://api.bristolbloods.com"
const DRAFT_ID = "2025-bristol-bloods";
function cx(...xs) {
    return xs.filter(Boolean).join(" ");
}
/* ----------------------------- API helpers ----------------------------- */
async function postJSON(path, body) {
    const res = await fetch(`${API_BASE}/draft/${DRAFT_ID}${path}`, {
        method: "POST",
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
async function postFile(path, file) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_BASE}/draft/${DRAFT_ID}${path}`, { method: "POST", body: fd });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
async function getJSON(path) {
    const res = await fetch(`${API_BASE}/draft/${DRAFT_ID}${path}`);
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
/* ----------------------------- Root Component ----------------------------- */
export default function AdminDashboard() {
    const [active, setActive] = useState("upload");
    const [status, setStatus] = useState("idle");
    const [toast, setToast] = useState(null);
    const [masterStat, setMasterStat] = useState(null);
    const [resultsStat, setResultsStat] = useState(null);
    const [keepersJson, setKeepersJson] = useState("");
    const [validateOut, setValidateOut] = useState(null);
    const [preEnrichOut, setPreEnrichOut] = useState(null);
    const [generateOut, setGenerateOut] = useState(null);
    const [report, setReport] = useState(null);
    const [activity, setActivity] = useState([]);
    const [hoverHelp, setHoverHelp] = useState(null);
    function log(line) {
        const ts = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        setActivity((a) => [`${ts} • ${line}`, ...a].slice(0, 200));
    }
    function flash(type, msg) {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    }
    /* ----------------------------- Actions ----------------------------- */
    async function handleUploadMaster(file) {
        setStatus("working");
        try {
            const res = await postFile("/upload-master", file);
            setMasterStat({ label: "Master uploaded", ok: true, detail: `bytes: ${res.bytes ?? "?"}`, ts: Date.now() });
            log("Master uploaded");
            flash("success", "Master CSV uploaded");
        }
        catch (e) {
            setMasterStat({ label: "Master upload failed", ok: false, detail: e?.message, ts: Date.now() });
            log(`Master upload failed`);
            flash("error", "Failed to upload master");
        }
        finally {
            setStatus("idle");
        }
    }
    async function handleUploadResults(file) {
        setStatus("working");
        try {
            const res = await postFile("/upload-results", file);
            setResultsStat({ label: "Results uploaded", ok: true, detail: `bytes: ${res.bytes ?? "?"}`, ts: Date.now() });
            log("Results uploaded");
            flash("success", "Draft results uploaded");
        }
        catch (e) {
            setResultsStat({ label: "Results upload failed", ok: false, detail: e?.message, ts: Date.now() });
            log("Results upload failed");
            flash("error", "Failed to upload results");
        }
        finally {
            setStatus("idle");
        }
    }
    async function handleSaveKeepers() {
        setStatus("working");
        try {
            const parsed = JSON.parse(keepersJson || "{}");
            await postJSON("/keepers", { keepers: parsed?.keepers ?? [] });
            log(`Keepers saved`);
            flash("success", "Keepers JSON saved");
        }
        catch (e) {
            log("Keepers save failed");
            flash("error", "Invalid JSON or network error");
        }
        finally {
            setStatus("idle");
        }
    }
    async function runValidate() {
        setStatus("working");
        try {
            const res = await postJSON("/validate");
            setValidateOut(res);
            flash("success", "Validation OK");
            log("Validation passed");
        }
        catch (e) {
            setValidateOut({ error: String(e?.message || e) });
            flash("error", "Validation failed");
            log("Validation failed");
        }
        finally {
            setStatus("idle");
        }
    }
    async function runPreEnrich() {
        setStatus("working");
        try {
            const res = await postJSON("/preenrich", {});
            setPreEnrichOut(res);
            flash("success", "Pre-enrich complete");
            log("Pre-enrich complete");
        }
        catch (e) {
            setPreEnrichOut({ error: String(e?.message || e) });
            flash("error", "Pre-enrich failed");
            log("Pre-enrich failed");
        }
        finally {
            setStatus("idle");
        }
    }
    async function runGenerate() {
        setStatus("working");
        try {
            const res = await postJSON("/generate", preEnrichOut ?? {});
            setGenerateOut(res);
            flash("success", "Model output saved");
            log("Generate finished");
        }
        catch (e) {
            setGenerateOut({ error: String(e?.message || e) });
            flash("error", "Generate failed");
            log("Generate failed");
        }
        finally {
            setStatus("idle");
        }
    }
    async function runAvatars() {
        setStatus("working");
        try {
            const res = await postJSON("/avatars", {});
            flash("success", "Avatar jobs queued");
            log(`Avatars enqueued`);
        }
        catch {
            flash("error", "Avatar generation failed");
            log("Avatars failed");
        }
        finally {
            setStatus("idle");
        }
    }
    async function runPublish() {
        setStatus("working");
        try {
            await postJSON("/publish", {});
            flash("success", "Published to R2");
            log("Published report.json");
        }
        catch {
            flash("error", "Publish failed");
            log("Publish failed");
        }
        finally {
            setStatus("idle");
        }
    }
    async function loadReport() {
        setStatus("working");
        try {
            const res = await getJSON("/report");
            setReport(res);
            flash("success", "Report loaded");
            log("Loaded report.json");
        }
        catch (e) {
            setReport({ error: String(e?.message || e) });
            flash("error", "No report found");
            log("Report fetch failed");
        }
        finally {
            setStatus("idle");
        }
    }
    /* ----------------------------- Layout ----------------------------- */
    const tabs = [
        { key: "upload", label: "Upload", desc: "Provide master, draft results & optional keepers" },
        { key: "validate", label: "Validate", desc: "Sanity checks & keeper slots" },
        { key: "generate", label: "Generate", desc: "Pre-enrich → LLM → Avatars → Publish" },
        { key: "preview", label: "Preview", desc: "View published report.json" },
    ];
    return (_jsxs("div", { className: "min-h-screen bg-neutral-950 text-neutral-100", children: [_jsxs("header", { className: "sticky top-0 z-40 bg-neutral-950/85 backdrop-blur border-b border-neutral-800", children: [_jsxs("div", { className: "mx-auto max-w-7xl px-5 py-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "h-9 w-9 rounded-lg bg-indigo-500/20 grid place-items-center", children: _jsx(Logo, {}) }), _jsxs("div", { children: [_jsx("div", { className: "text-sm uppercase tracking-widest text-neutral-400", children: "Admin" }), _jsx("div", { className: "text-lg font-semibold -mt-0.5", children: "Bristol Bloods" })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-xs text-neutral-400 hidden sm:inline", children: "Draft:" }), _jsx("span", { className: "px-2.5 py-1 rounded-full text-xs bg-neutral-800 border border-neutral-700 font-mono", children: DRAFT_ID }), _jsx(StatusBadge, { status: status })] })] }), _jsxs("div", { className: "mx-auto max-w-7xl px-5 pb-3 overflow-x-auto", children: [_jsx("div", { className: "inline-flex gap-2", children: tabs.map((t) => (_jsx("button", { onClick: () => setActive(t.key), onMouseEnter: () => setHoverHelp(t.desc), onMouseLeave: () => setHoverHelp(null), className: cx("px-3.5 py-2 rounded-lg text-sm transition border", active === t.key
                                        ? "bg-neutral-800 border-neutral-700 text-white shadow-inner"
                                        : "bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800/60 text-neutral-300"), children: t.label }, t.key))) }), hoverHelp && _jsx("div", { className: "text-xs text-neutral-400 mt-2", children: hoverHelp })] })] }), toast && (_jsx("div", { className: "fixed bottom-5 right-5 z-50", children: _jsx("div", { className: cx("rounded-xl px-4 py-3 text-sm shadow-xl border", toast.type === "success"
                        ? "bg-emerald-950/80 border-emerald-800 text-emerald-200"
                        : "bg-rose-950/80 border-rose-800 text-rose-200"), children: toast.msg }) })), _jsxs("main", { className: "mx-auto max-w-7xl px-5 py-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-7", children: [_jsxs("section", { className: "space-y-7", children: [active === "upload" && (_jsxs(Card, { title: "Upload Inputs", subtitle: "Upload your ADP+Projections master and 20-round draft results. Optionally paste keepers JSON.", children: [_jsxs("div", { className: "grid md:grid-cols-2 gap-5", children: [_jsx(Uploader, { title: "Master Eval CSV", description: "ADP + Projections (Value, Scarcity, Risk)", accept: ".csv", stat: masterStat, onFile: handleUploadMaster }), _jsx(Uploader, { title: "Draft Results CSV", description: "20 rounds from ESPN (Round, Pick, Player, Team, Pos, Fantasy Team)", accept: ".csv", stat: resultsStat, onFile: handleUploadResults })] }), _jsxs("div", { className: "mt-6", children: [_jsxs("h4", { className: "text-sm font-semibold mb-2", children: ["Keepers JSON ", _jsx("span", { className: "text-neutral-400 font-normal", children: "(optional)" })] }), _jsx("textarea", { className: "w-full min-h-[160px] rounded-xl bg-neutral-900/70 border border-neutral-800 px-3 py-2 font-mono text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30", placeholder: '{"keepers":[{"team":"PROJECT BADASS","player":"Bijan Robinson","pos":"RB","round":1,"pick":4}]}', value: keepersJson, onChange: (e) => setKeepersJson(e.target.value) }), _jsxs("div", { className: "mt-2 flex items-center gap-3", children: [_jsx("button", { onClick: handleSaveKeepers, className: "btn-primary", children: "Save keepers" }), _jsx("span", { className: "text-xs text-neutral-400", children: "Locks player/round/pick; also persisted to R2 for audit." })] })] })] })), active === "validate" && (_jsxs(Card, { title: "Validation", subtitle: "Verifies uploads exist, keeper slots map cleanly, and basic sanity checks.", children: [_jsx("div", { className: "flex items-center gap-3", children: _jsx("button", { onClick: runValidate, className: "btn-primary", children: "Run validation" }) }), _jsx(JsonBlock, { data: validateOut }), _jsx(HintList, { items: [
                                            "Both Master and Results must be present.",
                                            "If you see unmatched players in later steps, add aliases and rerun Pre-enrich.",
                                        ] })] })), active === "generate" && (_jsxs(Card, { title: "Generation Pipeline", subtitle: "Recommended order: Pre-enrich \u2192 Generate \u2192 Avatars \u2192 Publish.", children: [_jsxs("div", { className: "grid md:grid-cols-2 gap-3", children: [_jsx("button", { onClick: runPreEnrich, className: "btn-secondary", children: "1) Run Pre-enrich" }), _jsx("button", { onClick: runGenerate, className: "btn-secondary", children: "2) Run Generate (LLM)" }), _jsx("button", { onClick: runAvatars, className: "btn-secondary", children: "3) Generate Avatars" }), _jsx("button", { onClick: runPublish, className: "btn-primary", children: "4) Publish Report" })] }), _jsxs("div", { className: "mt-6 grid gap-5", children: [_jsx(SubCard, { title: "Pre-enrich summary", children: _jsx(JsonBlock, { data: summarizePre(preEnrichOut) }) }), _jsx(SubCard, { title: "Model output (truncated)", children: _jsx(JsonBlock, { data: truncateJson(generateOut, 40000) }) })] })] })), active === "preview" && (_jsxs(Card, { title: "Preview Published Report", subtitle: "Reads bristol-bloods-2025/report.json from R2.", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: loadReport, className: "btn-primary", children: "Load report" }), report?.teams?.length && (_jsxs("span", { className: "text-xs text-neutral-400", children: [report.teams.length, " teams"] }))] }), !report ? (_jsx(EmptyState, { title: "No report loaded", subtitle: "Click \u201CLoad report\u201D to fetch the latest publish." })) : report?.error ? (_jsx(JsonBlock, { data: report })) : (_jsx(LeagueGrid, { data: report }))] }))] }), _jsxs("aside", { className: "space-y-7", children: [_jsx(Card, { title: "Activity", children: _jsx("div", { className: "rounded-xl bg-neutral-900/70 border border-neutral-800 p-3", children: _jsx("div", { className: "h-[280px] overflow-auto font-mono text-xs leading-relaxed text-neutral-300", children: activity.length === 0 ? _jsx("div", { className: "text-neutral-500", children: "No activity yet." }) : (_jsx("ul", { className: "space-y-1", children: activity.map((l, i) => _jsx("li", { className: "whitespace-pre", children: l }, i)) })) }) }) }), _jsx(Card, { title: "Quick links", children: _jsxs("ul", { className: "text-sm text-neutral-300 space-y-2", children: [_jsx("li", { children: _jsx("a", { className: "link", href: `${API_BASE || ""}/draft/${DRAFT_ID}/health`.replace("//draft", "/draft"), target: "_blank", children: "/health" }) }), _jsx("li", { children: _jsx("a", { className: "link", href: `${API_BASE || ""}/draft/${DRAFT_ID}/report`.replace("//draft", "/draft"), target: "_blank", children: "/report.json" }) })] }) })] })] })] }));
}
/* ----------------------------- UI atoms ----------------------------- */
function Logo() {
    return (_jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", className: "text-indigo-300", children: _jsx("path", { fill: "currentColor", d: "M12 2a10 10 0 0 0-9.95 9h3.07A7 7 0 1 1 12 19.95V23A11 11 0 1 0 1 12h3.05A8 8 0 1 1 12 20.95V23h0z" }) }));
}
function StatusBadge({ status }) {
    const map = {
        idle: { t: "Idle", c: "bg-neutral-800 border-neutral-700 text-neutral-300" },
        working: { t: "Working", c: "bg-amber-900/50 border-amber-800 text-amber-200" },
        done: { t: "Done", c: "bg-emerald-900/50 border-emerald-800 text-emerald-200" },
        error: { t: "Error", c: "bg-rose-900/50 border-rose-800 text-rose-200" },
    };
    const m = map[status];
    return _jsx("span", { className: cx("px-2.5 py-1 rounded-full text-xs border", m.c), children: m.t });
}
function Card({ title, subtitle, children }) {
    return (_jsxs("section", { className: "rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 shadow-lg shadow-black/20", children: [_jsxs("header", { className: "mb-4", children: [_jsx("h2", { className: "text-lg font-semibold", children: title }), subtitle && _jsx("p", { className: "text-sm text-neutral-400 mt-1", children: subtitle })] }), children] }));
}
function SubCard({ title, children }) {
    return (_jsxs("div", { className: "rounded-xl border border-neutral-800 bg-neutral-950/50 p-4", children: [_jsx("h3", { className: "text-sm font-semibold text-neutral-300 mb-3", children: title }), children] }));
}
function HintList({ items }) {
    return (_jsx("div", { className: "mt-5 rounded-xl bg-neutral-950/40 border border-neutral-800 p-4", children: _jsx("ul", { className: "list-disc ml-5 space-y-1 text-sm text-neutral-400", children: items.map((t, i) => _jsx("li", { children: t }, i)) }) }));
}
function EmptyState({ title, subtitle }) {
    return (_jsx("div", { className: "rounded-xl border border-neutral-800 bg-neutral-950/40 p-6 grid place-items-center text-center", children: _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "mx-auto h-10 w-10 rounded-full bg-neutral-800 grid place-items-center", children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", className: "text-neutral-300", children: _jsx("path", { fill: "currentColor", d: "M19 19H5V8h14m0-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2M11 10h2v6h-2v-6Z" }) }) }), _jsx("h4", { className: "font-semibold", children: title }), subtitle && _jsx("p", { className: "text-sm text-neutral-400", children: subtitle })] }) }));
}
function JsonBlock({ data }) {
    if (!data)
        return null;
    return (_jsx("div", { className: "mt-5", children: _jsx("pre", { className: "max-h-[420px] overflow-auto rounded-xl border border-neutral-800 bg-neutral-950/70 p-3 text-xs leading-relaxed text-neutral-200", children: JSON.stringify(data, null, 2) }) }));
}
function Uploader({ title, description, accept, stat, onFile, }) {
    const [drag, setDrag] = useState(false);
    return (_jsx("div", { className: cx("rounded-xl border p-4 transition shadow-sm", drag ? "border-indigo-600 bg-indigo-500/5" : "border-neutral-800 bg-neutral-950/40"), children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "h-10 w-10 rounded-lg bg-neutral-800 grid place-items-center shrink-0", children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", className: "text-neutral-300", children: _jsx("path", { fill: "currentColor", d: "M19 20H5a2 2 0 0 1-2-2V8l6-5h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2M5 8h14V5H9.5L5 8Z" }) }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h4", { className: "font-semibold", children: title }), _jsx("span", { className: "text-[10px] text-neutral-400 uppercase border border-neutral-700 rounded px-1.5 py-0.5", children: accept })] }), _jsx("p", { className: "text-sm text-neutral-400 mt-1", children: description }), _jsxs("label", { onDragOver: (e) => { e.preventDefault(); setDrag(true); }, onDragLeave: () => setDrag(false), onDrop: (e) => {
                                e.preventDefault();
                                setDrag(false);
                                const f = e.dataTransfer.files?.[0];
                                if (f)
                                    onFile(f);
                            }, className: "mt-3 flex items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-700/70 bg-neutral-900/60 hover:bg-neutral-900 cursor-pointer px-3 py-6 transition", children: [_jsx("input", { type: "file", className: "hidden", accept: accept, onChange: (e) => {
                                        const f = e.target.files?.[0];
                                        if (f)
                                            onFile(f);
                                    } }), _jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", className: "text-neutral-300", children: _jsx("path", { fill: "currentColor", d: "M12 16V8m0 0l-3 3m3-3l3 3M5 19h14a2 2 0 0 0 2-2v-2a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v2a2 2 0 0 0 2 2Z" }) }), _jsxs("span", { className: "text-sm text-neutral-300", children: ["Drop file or ", _jsx("span", { className: "underline/50", children: "choose" })] })] }), stat && (_jsxs("div", { className: "mt-3 text-xs", children: [_jsxs("div", { className: cx(stat.ok ? "text-emerald-300" : "text-rose-300"), children: [stat.label, stat.ok ? " ✓" : " ✕"] }), stat.detail && _jsx("div", { className: "text-neutral-400", children: stat.detail })] }))] })] }) }));
}
function LeagueGrid({ data }) {
    const teams = data?.teams || data?.modelOutput?.teams || [];
    if (!Array.isArray(teams) || teams.length === 0)
        return _jsx(EmptyState, { title: "No teams in report" });
    return (_jsx("div", { className: "mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5", children: teams.map((t, i) => {
            const letter = (t.grade || t.letter || "–");
            const badge = letter[0];
            const tone = badge === "A" ? "bg-emerald-700/25 text-emerald-200 border-emerald-800/60" :
                badge === "B" ? "bg-sky-700/25 text-sky-200 border-sky-800/60" :
                    badge === "C" ? "bg-amber-700/25 text-amber-200 border-amber-800/60" :
                        "bg-rose-800/30 text-rose-200 border-rose-900/60";
            return (_jsxs("div", { className: "rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 transition", children: [_jsx("div", { className: "aspect-[16/9] bg-neutral-800/50 flex items-center justify-center", children: t.cardUrl ? (_jsx("img", { src: t.cardUrl, alt: t.teamName, className: "w-full h-full object-cover", loading: "lazy" })) : (_jsx("div", { className: "text-neutral-400 text-sm", children: "No card image" })) }), _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-semibold", children: t.teamName || t.name }), _jsx("p", { className: "text-xs text-neutral-400", children: t.owner || t.firstName || "" })] }), _jsx("span", { className: cx("px-2.5 py-1 rounded-full text-xs border font-semibold", tone), children: letter })] }), _jsx("p", { className: "text-sm text-neutral-300 mt-2 line-clamp-3", children: t.summary || t.summaryShort || "—" })] })] }, i));
        }) }));
}
/* ----------------------------- Utility ----------------------------- */
function summarizePre(pre) {
    if (!pre)
        return null;
    return pre.summary ?? pre.joins ?? pre.schema ?? pre;
}
function truncateJson(j, max = 20000) {
    if (!j)
        return null;
    const s = JSON.stringify(j, null, 2);
    return s.length > max ? JSON.parse(s.slice(0, max)) : j;
}
/* ----------------------------- Shared buttons (Tailwind) ----------------------------- */
/* Tailwind v4: these classes are just reused utility strings */
const btnBase = "inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition";
const ring = "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40";
const border = "border border-neutral-700";
function ButtonBase({ className, children, ...props }) {
    return _jsx("button", { className: cx(btnBase, ring, className), ...props, children: children });
}
function Btn({ tone = "neutral", ...p }) {
    if (tone === "primary")
        return _jsx(ButtonBase, { ...p, className: cx(border, "bg-indigo-600/90 hover:bg-indigo-600 text-white", p.className) });
    if (tone === "secondary")
        return _jsx(ButtonBase, { ...p, className: cx(border, "bg-neutral-800 hover:bg-neutral-700 text-neutral-100", p.className) });
    return _jsx(ButtonBase, { ...p, className: cx(border, "bg-neutral-900 hover:bg-neutral-800 text-neutral-100", p.className) });
}
/* semantic aliases */
function Button(props) { return _jsx(Btn, { ...props }); }
const Primary = (props) => _jsx(Button, { tone: "primary", ...props });
const Secondary = (props) => _jsx(Button, { tone: "secondary", ...props });
/* exposed classNames for inline use */
Object.assign(globalThis, {
// provide classnames for buttons in JSX above without extra imports
});
/* convenience wrappers */
const btnPrimary = "inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-indigo-600/90 hover:bg-indigo-600 text-white border border-indigo-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40";
const btnSecondary = "inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40";
/* For brevity in JSX above */
function ButtonText() { return null; }

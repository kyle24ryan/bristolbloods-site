export interface Env {
  OPENAI_API_KEY: string;
  LEAGUE: DurableObjectNamespace;
  CARDS: R2Bucket;  
  DRAFT_ROOM: DurableObjectNamespace;
}

const LEAGUE_ID   = "bristol-bloods-2025";
const LEAGUE_SIZE = 12;
const R2_PREFIX   = `${LEAGUE_ID}/cards/`;
const REPORT_ROOT_PREFIX = "bristol-bloods-2025";
const REPORT_KEYS = {
  inputs: (name: string) => `${REPORT_ROOT_PREFIX}/inputs/${name}`,
  report: () => `${REPORT_ROOT_PREFIX}/report.json`,
  reportCard: (teamSlug: string) => `${REPORT_ROOT_PREFIX}/cards/report/${teamSlug}.jpg`,
  revealCard: (teamSlug: string) => `${REPORT_ROOT_PREFIX}/cards/reveal/${teamSlug}.jpg`, // existing
};

const UNICORNS: Record<string, string[]> = {
  "travis hunter": ["WR", "DB"],
};

// Hosted on your GitHub Pages site (Step 1)
const PERSONAS_URL = "https://bristolbloods.com/personas/personas.json";
const PHOTOS_BASE  = "https://bristolbloods.com/photos/";
const DEFAULT_TEAM_ALIASES: Record<string, string> = {
  // team name -> canonical persona.teamName
  "hock-tua on this dak": "Team Bad Luck",       // maps to persona 'chino'
  "i diggs a chubb!!":    "I DIGGS a CHUBB",     // maps to persona 'erica'
};

const DEFAULT_PERSONA_ALIASES: Record<string, string> = {
  // team name -> persona key (skip teamName lookup entirely)
  // (useful if the persona.teamName itself changes)
  // "some funky name": "kyle",
};

const PHOTO_FILES: Record<string, string> = {
  kyle:    "kyle.png",
  amy:     "amy.jpg",
  james:   "james.jpg",
  jared:   "jared.jpg",
  kristyn: "kristyn.jpg",
  justin: "justin.jpg",
  chino: "chino.jpg",
  ovi: "ovi.jpeg",
  mike: "mike.jpg",
  tommy: "tommy.jpg",
  travis: "travis.jpg",
  erica: "erica.jpg"
};

// ------------------ PIXAR GLOBAL RULES + PERSONAS ------------------

const PIXAR_GLOBAL = `
Pixar Toy Story style 3D cartoon portrait poster.
Style: glossy, colorful Pixar character render, high detail, playful yet bold.
Square poster layout 1024x1024.
Background: matte black with faint dark-red bandana texture, softened into Pixar-like fabric.
Large hand-painted red number {slot} (draft slot) is already present and DOMINANT.
Team name should appear opposite the draft slot. The name should be COMPLETE and spelt correctly.  

TYPOGRAPHY
- Render EXACTLY TWO text elements: (1) FIRST NAME at top in bold white stencil; (2) ONE supporting title with the official team name (spelt correctly and complete).
- Do NOT repeat the team name anywhere else. No duplicate captions, slogans, watermarks, or extra numbers.

MOTIFS
- Persona motifs (favorite teams, hobbies, icons) must be SUBTLE BACKGROUND textures and NO graphics or NO team names on the shirt.
- Low contrast (≈10–20% opacity), monochrome/duotone, small scale.
- Do NOT overlap the face, glasses, beard, or the large red {slot}. Keep clean margins.

COMPOSITION
- Character remains the clear focal point; centered portrait framing with clean negative space.
- No extra people. Handheld props are ok when appropiate. No poster borders or UI chrome.
- Keep likeness if a base photo is provided; IMPORTANT maintain key facial characteristics.
`.trim();

type Persona = {
  appearance: string;
  teamName: string;
  motifs?: string[];      // subtle background / shirt motifs
  background?: string[];  // optional big-scene hints (still subtle)
};

const PERSONAS: Record<string, Persona> = {
  kyle: {
    appearance: "Full beard, black-rim glasses, baseball cap worn backwards, medium/average build (not overweight). Blue eyes.",
    teamName: "The Losing Edge",
    motifs: ["Miami Dolphins fan detail", "South Park motif (tiny, faint)"],
    background: ["South Park landscape"],
  },
  amy: {
    appearance: "Expressive eyes, slightly anxious but playful; petite build with large chest (boobs). Blue eyes.",
    teamName: "F My Fantasy Football Team",
    motifs: ["Seattle/PNW vibe", "Seahawks hint", "loves cats and dogs", "leafy tree silhouette", "TV screen glow"],
    background: ["PNW forest"],
  },
  james: {
    appearance: "Bald with backwards hat (no mohawk, no hair), tattoos, punk-rock vibe, relaxed smirk; shirt says 'Fat Spliffs' stay true to font style on shirt. Blue eyes.",
    teamName: "BAD NEWS FOR ERICA",
    motifs: ["Los Angeles Chargers hint", "guitar or music note for love of punk/ska", "soccer ball detail", "tattoo-inspired texture"],
    background: ["concert venue vibes"],
  },
  jared: {
    appearance: "Confident, polished look; stylish, luxury vibe; not fat (a little extra is fine).",
    teamName: "Cocktails and Dreams",
    motifs: ["NY Jets hint", "cocktail glass glow", "luxury sneaker outline", "casino/gambling chips"],
    background: ["casino strip"],
  },
  chino: {
    appearance: "Oversized t-shirt (not fat, maybe a little chub), slight slouch, worried smirk.",
    teamName: "Team Bad Luck",
    motifs: [
      "fishing line / hook detail",
      "faint puff of smoke / weed leaf woven into background",
      "scattered, faded team logos to imply no true fandom"
    ],
    background: ["stadium lights rising subtly in distance"],
  },
  justin: {
    appearance: "Shaved head, relaxed posture, carefree but intense expression.",
    teamName: "High Expectations",
    motifs: [
      "fishing rod detail",
      "boat outline",
      "faint turntables or DJ headphones",
      "smoky haze suggesting weed"
    ],
    background: ["subtle silhouettes of stripper poles", "neon club light glow"],
  },
  kristyn: {
    appearance: "Relaxed, friendly expression; subtle flower/cannabis 'flower power' vibe (tasteful).",
    teamName: "Flower Power",
    motifs: ["small flower silhouette", "leaf filigree"],
    background: ["science lab"],
  },
  ovi: {
    appearance: "Lean build, casual posture, confident smirk with a hint of melancholy; tattoos visible; wearing a shirt.",
    teamName: "Your Mom's Haus",
    motifs: ["hot sauce bottle icon", "Husky dog silhouette", "glowing laptop/code snippet texture", "small Eagles hint"],
    background: ["Philadelphia Eagles stadium silhouette", "faint mountain outline"],
  },
  erica: {
    appearance: "Sarcastic sideways smirk; playful but sharp personality.",
    teamName: "I DIGGS a CHUBB",
    motifs: ["New York Giants hint", "faint sarcastic eye-roll motif woven into texture"],
    background: ["subtle NJ/NY skyline silhouette"],
  },
  tommy: {
    appearance: "Beard, slicked-back medium hair, visible chest hair under casual shirt; shit-eating grin.",
    teamName: "PROJECT BADASS",
    motifs: ["fantasy trophy icon", "nurse scrubs pocket silhouette", "five small icons/stars for five kids"],
    background: ["subtle hospital motifs: heartbeat monitor line glow, faint cross silhouette"],
  },
  travis: {
    appearance: "Clean-cut, sharp features; tuxedo with bow tie; cocky, serious model-like glare.",
    teamName: "Protein Balls",
    motifs: ["luxury car silhouette", "faint engineering blueprint lines", "tiny 'girl dad' detail (toy block or tiara)"],
    background: ["subtle travel motifs: airplane contrails, passport stamp textures"],
  },
  mike: {
    appearance: "Strong, confident look with tight beard; semi-intense but laid-back glare.",
    teamName: "Hallin Ass",
    motifs: ["tattoo linework", "faint mobster-movie silhouette (fedora/gangster outline)"],
    background: ["NY sports hints: faint Jets silhouette, Mets stitching texture, NYC skyline hints"],
  },
};

const GRADE_FACE: Record<string, string> = {
  "A": "confident grin",
  "A-": "confident grin",
  "B+": "subtle smirk",
  "B": "subtle smirk",
  "B-": "subtle smirk",
  "C+": "neutral with faint worry",
  "C": "neutral with faint worry",
  "C-": "neutral with faint worry",
  "D+": "tight grimace",
  "D": "tight grimace",
  "F": "comedic shock, wide eyes"
};

// Compose final prompt from global rules + persona
function buildPixarPrompt(slug: string, firstName: string, slot: number): string {
  const p = PERSONAS[slug];
  const displayName = (firstName || slug || "").trim();
  if (!p) {
    return defaultPixarPrompt(displayName).replace("{slot}", String(slot));
  }
  const motifs = (p.motifs?.length ? p.motifs : []).map(m => `- ${m}`).join("\n");
  const bg     = (p.background?.length ? p.background : []).map(b => `- ${b}`).join("\n");

  return `
${PIXAR_GLOBAL}

CHARACTER
${p.appearance}

TEXT
- Bold white stencil first name at top: "${displayName.toUpperCase()}".
- Supporting title (team name, once only): "${p.teamName}".

MOTIFS (apply as subtle textures)
${motifs || "- (minimal)"}

BACKGROUND (subtle, low-contrast)
${bg || "- (keep background simple)"}
`.replaceAll("{slot}", String(slot)).trim();
}

function defaultPixarPrompt(firstName: string): string {
  return `
Pixar Toy Story style 3D cartoon portrait poster of ${firstName}.
Square 1024x1024 poster with matte black background and faint dark-red bandana texture.
Large hand-painted red number {slot} (draft slot).
Bold white stencil text: "${firstName.toUpperCase()}" at top.
Supporting title with the official team name (include ONCE only).
Fantasy football draft reveal card, like an animated movie poster.
Keep likeness if base photo provided.
`.trim();
}

const ALLOWED_ORIGINS = new Set([
  "https://bristolbloods.com",
  "https://www.bristolbloods.com",
  "https://bristolbloods-site.pages.dev",
  "https://api.bristolbloods.com"	
]);

function withCORS(resp: Response, origin: string | null) {
  const h = new Headers(resp.headers);
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    h.set("Access-Control-Allow-Origin", origin);
    h.append("Vary", "Origin");
  }
  return new Response(resp.body, { status: resp.status, headers: h });
}


// ------------------------
// Helper: prompt builder for portrait-only report cards (no text baked in)
// ------------------------
function buildAvatarPrompt(opts: { firstName: string; teamName: string; appearance: string; motifs?: string[]; background?: string[]; face: string; }): string {
  const motifs = (opts.motifs||[]).slice(0,4).join(", ");
  const bg = (opts.background||[]).slice(0,2).join(", ");
  return [
    "Pixar Toy Story style 3D cartoon portrait, glossy, colorful, high detail.",
    "Square 1024x1024 poster, matte black background with faint fabric texture.",
    `Facial expression: ${opts.face}.`,
    `Subject: ${opts.appearance}. Centered portrait, clean negative space, no text, no numbers, no watermarks.`,
    motifs ? `Subtle monochrome background motifs: ${motifs}. (10-20% opacity)` : "",
    bg ? `Scene hints (very subtle): ${bg}.` : "",
    "Strict: Do not render any text, team logos, or jersey numbers. Portrait only."
  ].filter(Boolean).join("\n");
}

function teamSlug(name: string): string { return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }

function b64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ---------------- Worker (HTTP edge) ----------------
export default {
  async fetch(req: Request, env: Env) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      const origin = req.headers.get("Origin");
      const h = new Headers({
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      });
      if (origin && ALLOWED_ORIGINS.has(origin)) {
        h.set("Access-Control-Allow-Origin", origin);
        h.append("Vary", "Origin");
      }
      return new Response(null, { status: 204, headers: h });
    }


    if (url.pathname === "/health") return new Response("ok");

    // // --- Report-card admin routes: /draft/:id/*
    // if (url.pathname.startsWith("/draft/")) {
	  // const parts = url.pathname.split("/"); // ["", "draft", ":id", ...]
	  // const draftId = parts[2] || "2025-bristol-bloods";
	  // const id = env.DRAFT_ROOM.idFromName(draftId);
	  // const stub = env.DRAFT_ROOM.get(id);
	  // const r = await stub.fetch(req);
	  // return withCORS(new Response(await r.text(), {
    //     status: r.status,
    //     headers: { "content-type": "application/json" }
    //   }), req.headers.get("Origin"));
    // }

    if (url.pathname.startsWith("/draft/")) {
      const parts   = url.pathname.split("/");
      const draftId = parts[2] || "2025-bristol-bloods";
      const id      = env.DRAFT_ROOM.idFromName(draftId);
      const stub    = env.DRAFT_ROOM.get(id);

      const r = await stub.fetch(req);  // DO returns the real response (image/json/etc.)
      const resp = new Response(r.body, { status: r.status, headers: r.headers });
      return withCORS(resp, req.headers.get("Origin"));
    }

    
    // Serve a cached image directly from R2: /image/kyle.png or /image/kyle
    if (url.pathname.startsWith("/image/")) {
      const tail = url.pathname.replace("/image/", "");
      const slug = tail.replace(/\.png$/i, "").toLowerCase();
      const key  = `${R2_PREFIX}${slug}.png`;
      const obj  = await env.CARDS.get(key);
      if (!obj) return new Response("Not found", { status: 404 });
      return new Response(obj.body, {
        headers: {
          "content-type": "image/png",
          "cache-control": "public, max-age=31536000, immutable"
        }
      });
    }

    if (url.pathname === "/state") {
      const id   = env.LEAGUE.idFromName(LEAGUE_ID);
      const stub = env.LEAGUE.get(id);
      const r = await stub.fetch("https://internal/state");
      return withCORS(new Response(await r.text(), {
        status: r.status,
        headers: { "content-type": "application/json" }
      }), req.headers.get("Origin"));
    }

    if (url.pathname === "/reveal") {
      const name = await readName(req);
      if (!name) return new Response("Missing name", { status: 400 });

      const id   = env.LEAGUE.idFromName(LEAGUE_ID);
      const stub = env.LEAGUE.get(id);

      const r = await stub.fetch("https://internal/assign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (!r.ok) return new Response(await r.text(), { status: r.status });

      // Stream the already-persisted PNG (or freshly persisted one)
      const slug = normalize(name);
      const key  = `${R2_PREFIX}${slug}.png`;
      const obj  = await env.CARDS.get(key);
      if (!obj) return new Response("Image missing", { status: 500 });
      return new Response(obj.body, {
        headers: {
          "content-type": "image/png",
          "cache-control": "public, max-age=31536000, immutable"
        }
      });
    }

    if (url.pathname === "/reset" && req.method === "POST") {
      const id   = env.LEAGUE.idFromName(LEAGUE_ID);
      const stub = env.LEAGUE.get(id);

      const r = await stub.fetch("https://internal/reset", {
        method: "POST",
        headers: {
          "x-admin-token": req.headers.get("x-admin-token") || ""
        }
      });

      return new Response(await r.text(), {
        status: r.status,
        headers: { "content-type": "application/json" }
      });
    }

    // POST /regenerate  { name }
    // Re-renders the same manager's card (preserves slot), caps at 5 redos.
    // Returns: { ok, remaining, slot } JSON (no image stream)
    if (url.pathname === "/regenerate" && req.method === "POST") {
      const name = await readName(req);
      if (!name) return new Response("Missing name", { status: 400 });

      const id   = env.LEAGUE.idFromName(LEAGUE_ID);
      const stub = env.LEAGUE.get(id);

      const r = await stub.fetch("https://internal/regenerate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name })
      });

      // Relay JSON with CORS
      return withCORS(new Response(await r.text(), {
        status: r.status,
        headers: { "content-type": "application/json" }
      }), req.headers.get("Origin"));
    }

    // Tiny test form unchanged...
    if (url.pathname === "/" && req.method === "GET") {
      return html(`<!doctype html><meta charset="utf-8">
      <style>body{display:grid;place-items:center;height:100dvh;background:#0b0b0b;color:#fff;font:16px system-ui}</style>
      <div>ok</div>`);
    }

    return new Response("Not found", { status: 404 });
  }
};

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim().length);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = splitCSVLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const cells = splitCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => obj[h.trim()] = (cells[i] ?? "").trim());
    return obj;
  });
  return { headers, rows };
}
function splitCSVLine(line: string): string[] {
  const out: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (q && line[i+1] === '"') { cur += '"'; i++; } else { q = !q; } }
    else if (ch === "," && !q) { out.push(cur); cur = ""; }
    else { cur += ch; }
  }
  out.push(cur);
  return out;
}

const REQUIRED_MASTER_COLUMNS = ["Player","Team","Position","Proj FPTS","ADP","Value","Positional Scarcity","Risk Flags"];
const REQUIRED_RESULTS_COLUMNS = ["Round","Pick","Overall","Player","NFL Team","Pos","Fantasy Team","Notes"];

function hasColumns(headers: string[], required: string[]) {
  const missing = required.filter(c => !headers.includes(c));
  return { ok: missing.length === 0, missing };
}

// ------------------------
// Settings & weights (defaults; can be overridden via request body)
// ------------------------
const DEFAULT_SETTINGS = {
  teamsCount: 12,
  starters: { QB:1, RB:2, WR:2, TE:1, FLEX:1, LB:1, DL:1, DB:1, K:1 },
  replacement: { QB:14, RB:30, WR:30, TE:14, LB:14, DL:14, DB:14, K:14 }
};
const DEFAULT_WEIGHTS = {
  grading: {
    signalWeights: { projection: 0.35, scarcity: 0.30, adpDelta: 0.20, efficiency: 0.15 },
    roundWeightCurve: { 1:1.0,2:0.95,3:0.9,4:0.85,5:0.8,6:0.75,7:0.7,8:0.65,9:0.6,10:0.55,11:0.5,12:0.45,13:0.4,14:0.35,15:0.3,16:0.25,17:0.2,18:0.15,19:0.1,20:0.05 },
    posWeight: { QB:1.0, RB:1.2, WR:1.2, TE:0.9, FLEX:1.0, K:0.2, LB:0.25, DL:0.25, DB:0.25 },
    idpCap: 4.0, idpDiscount: 0.5
  },
  risk: { injuryPenalty: -0.3, volatileAdpPenalty: -0.2 },
  awards: { stealThreshold: 15, reachThreshold: 15 },
  bands: { A:10.5, 'A-':9.5, 'B+':8.5, B:7.5, 'B-':6.5, 'C+':5.5, C:4.5, 'C-':3.5, 'D+':2.5, D:1.5, F:0 }
};



// ---------------- Durable Object (stateful) ----------------
export class LeagueDO {
  state: DurableObjectState;
  env: Env;
  constructor(state: DurableObjectState, env: Env) { this.state = state; this.env = env; }

  async fetch(req: Request) {
    const url = new URL(req.url);

    if (url.pathname === "/reset" && req.method === "POST") {
      const token = req.headers.get("x-admin-token");
      if (token !== "CHANGE_ME") return new Response("Forbidden", { status: 403 });

      // Clear DO state
      await this.state.storage.delete("map");
      await this.state.storage.delete("pool");
      await this.state.storage.delete("names");
      await this.state.storage.delete("reveals"); // if used

      // Clear R2 under this league prefix
      try {
        let cursor: string | undefined = undefined;
        let deleted = 0;
        do {
          const page = await this.env.CARDS.list({ prefix: R2_PREFIX, cursor });
          if (page.objects.length) {
            await Promise.all(page.objects.map(obj => this.env.CARDS.delete(obj.key)));
            deleted += page.objects.length;
          }
          cursor = page.truncated ? page.cursor : undefined;
        } while (cursor);
        return json({ ok: true, deleted });
      } catch (e) {
        console.warn("R2 delete failed", e);
        return json({ ok: true, deleted: 0, warning: "R2 delete failed" });
      }
    }

    // Return current state for overview
    if (url.pathname === "/state") {
      const map     = (await this.state.storage.get<Record<string, number>>("map")) || {};
      const names   = (await this.state.storage.get<Record<string, string>>("names")) || {};
      const reveals = (await this.state.storage.get<Record<string, string>>("reveals")) || {};

      const list = Object.entries(map).map(([slug, slot]) => ({
        name: names[slug] || slug,
        slug,
        slot,
        imageUrl: `/image/${slug}.png`,
        revealedAt: reveals[slug] || null
      })).sort((a,b)=>a.slot-b.slot);

      return json(list);
    }

    if (url.pathname === "/regenerate" && req.method === "POST") {
      const { name } = await req.json() as { name: string };
      const slug = normalize(name);

      // Current state
      const map   = (await this.state.storage.get<Record<string, number>>("map"))   || {};
      const names = (await this.state.storage.get<Record<string, string>>("names")) || {};
      const redos = (await this.state.storage.get<Record<string, number>>("redos")) || {};

      // Must already have a slot (we're preserving it)
      if (!(slug in map)) {
        return json({ ok:false, error:"No slot yet for this manager" }, 409);
      }

      // Cap at 5
      const used = redos[slug] ?? 0;
      const MAX  = 5;
      if (used >= MAX) {
        return json({ ok:false, remaining:0, error:"Redo limit reached" }, 429);
      }

      const slot      = map[slug];
      const firstName = names[slug] || name;

      // 🔥 Generate a NEW image via OpenAI and overwrite R2
      const key   = `${R2_PREFIX}${slug}.png`;
      const b64   = await this.renderCard(slug, firstName, slot);        // <-- calls OpenAI (edits or generation)
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      await this.env.CARDS.put(key, bytes, {
        httpMetadata: { contentType: "image/png" } // overwrite
      });

      // Increment redo counter and persist
      redos[slug] = used + 1;
      await this.state.storage.put("redos", redos);

      return json({ ok:true, slot, remaining: MAX - redos[slug] });
    }

    if (url.pathname === "/assign" && req.method === "POST") {
      const { name } = await req.json() as { name: string };
      const slug = normalize(name);

      let map  = (await this.state.storage.get<Record<string, number>>("map"))  || {};
      let pool = (await this.state.storage.get<number[]>("pool")) || [];
      let names= (await this.state.storage.get<Record<string, string>>("names"))|| {};

      if (!pool.length && !Object.keys(map).length) {
        pool = Array.from({ length: LEAGUE_SIZE }, (_, i) => i + 1);
        await this.state.storage.put("pool", pool);
        await this.state.storage.put("map", map);
        await this.state.storage.put("names", names);
      }

      if (!(slug in map)) {
        if (!pool.length) return new Response("All slots taken", { status: 409 });
        const idx  = Math.floor(Math.random() * pool.length);
        const slot = pool.splice(idx, 1)[0];
        map[slug]  = slot;
        names[slug]= name;

        // NEW: capture reveal time
        const reveals = (await this.state.storage.get<Record<string, string>>("reveals")) || {};
        reveals[slug] = new Date().toISOString();

        await this.state.storage.put("pool", pool);
        await this.state.storage.put("map", map);
        await this.state.storage.put("names", names);
        await this.state.storage.put("reveals", reveals);
      }

      const slot = map[slug];

      // Ensure image exists in R2; if not, generate+persist once
      const key = `${R2_PREFIX}${slug}.png`;
      const head = await this.env.CARDS.head(key);
      if (!head) {
        const b64 = await this.renderCard(slug, name, slot);
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        await this.env.CARDS.put(key, bytes, { httpMetadata: { contentType: "image/png" } });
      }

      return json({ ok: true, slot, key });
    }

    return new Response("Bad request", { status: 400 });
  }

  async renderCard(slug: string, firstName: string, slot: number): Promise<string> {
    const prompt = buildPixarPrompt(slug, firstName, slot);

    // Try with a base portrait (edits); fall back to generation
    const fileName = PHOTO_FILES[slug] || `${slug}.png`;
    const photoUrl = `https://bristolbloods.com/photos/${fileName}`;

    try {
      const resp = await fetch(photoUrl);
      if (!resp.ok) throw new Error("no photo");
      const ab   = await resp.arrayBuffer();
      const mime = resp.headers.get("content-type") || "image/png";
      const file = new File([ab], fileName, { type: mime });

      const form = new FormData();
      form.append("model", "gpt-image-1");
      form.append("prompt", prompt);
      form.append("size", "1024x1024");
      form.append("image", file);

      const ai = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { authorization: `Bearer ${this.env.OPENAI_API_KEY}` },
        body: form
      });
      if (!ai.ok) throw new Error(`OpenAI edits ${ai.status}: ${await ai.text()}`);
      const data = await ai.json();
      const b64  = data.data?.[0]?.b64_json as string | undefined;
      if (!b64) throw new Error("no image in edits");
      return b64;
    } catch {
      const ai = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { authorization: `Bearer ${this.env.OPENAI_API_KEY}`, "content-type":"application/json" },
        body: JSON.stringify({ model: "gpt-image-1", prompt, size: "1024x1024" })
      });
      if (!ai.ok) throw new Error(`OpenAI gen ${ai.status}: ${await ai.text()}`);
      const data = await ai.json();
      const b64  = data.data?.[0]?.b64_json as string | undefined;
      if (!b64) throw new Error("no image in gen");
      return b64;
    }
  }
}

// --------------- helpers ---------------
async function readName(req: Request): Promise<string> {
  const url = new URL(req.url);
  if (req.method === "GET") return (url.searchParams.get("name") || "").trim();
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const j = await req.json(); return (j.name || "").trim();
  }
  const f = await req.formData(); return (String(f.get("name") || "")).trim();
}

async function loadPersonas(): Promise<Record<string, any>> {
  // Cache via Cloudflare edge cache for 5 minutes
  const res = await fetch(PERSONAS_URL, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!res.ok) throw new Error(`Failed personas: ${res.status}`);
  return await res.json();
}

function buildPrompt(theme: string, p: any, slot: number): string {
  return [
    theme,
    `Draft slot number: ${slot}`,
    `Manager first name: ${p.firstName ?? ""}`,
    p.teamName ? `Team name: ${p.teamName}` : "",
    p.vibe ? `Vibe: ${p.vibe}` : "",
    p.mascot ? `Mascot/icon: ${p.mascot}` : "",
    Array.isArray(p.colors) && p.colors.length ? `Palette hints: ${p.colors.join(", ")}` : "",
    p.loves ? `Likes: ${p.loves}` : "",
    p.hates ? `Dislikes: ${p.hates}` : "",
    p.notes ? `Notes: ${p.notes}` : "",
    `Keep likeness if base photo provided.`
  ].filter(Boolean).join("\n");
}

function normalize(s: string) { return s.trim().toLowerCase().replace(/\s+/g, "-"); }
function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" }});
}
function html(s: string) { return new Response(s, { headers: { "content-type": "text/html" } }); }

// ------------------------
// Utils: normalization, positions, percentiles
// ------------------------
function normName(s: string): string {
  return (s||"")
    .toLowerCase()
    .replace(/\.(?=\s|$)/g, "")
    .replace(/\s+/g, " ")
    .replace(/ jr$| sr$| iii$| ii$| iv$/g, "")
    .trim();
}
function mapPos(p: string): string {
  const x = (p||'').toUpperCase();
  if (x === 'ILB' || x === 'OLB') return 'LB';
  if (x === 'DE' || x === 'DT' || x === 'EDGE') return 'DL';
  if (x === 'SS' || x === 'FS' || x === 'S' || x === 'CB') return 'DB';
  return x;
}
function pct(arr: number[], q: number): number {
  if (!arr.length) return 0;
  const a = [...arr].sort((a,b)=>a-b);
  const pos = (a.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (a[base+1] !== undefined) return a[base] + rest * (a[base+1] - a[base]);
  return a[base];
}

export class DraftRoom implements DurableObject {
  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    try {
      if (path.endsWith("/upload-master") && req.method === "POST") {
        return this.uploadCSV(req, "master_eval_2025.csv");
      }
      if (path.endsWith("/upload-results") && req.method === "POST") {
        return this.uploadCSV(req, "draft_results.csv");
      }
      if (path.endsWith("/keepers") && req.method === "POST") {
        return this.setKeepers(req);
      }
      if (path.endsWith("/aliases") && req.method === "POST") {
        return this.saveAliases(req);
      }
      if (path.endsWith("/validate") && req.method === "POST") {
        return this.validateAll();
      }
      if (path.endsWith("/preenrich-cache") && req.method === "GET") {
        const cache = await this.state.storage.get("_preenrich_cache");
        if (!cache) return json({ status: "error", message: "no cache yet" }, 404);
        return json(cache);
      }
      if (path.endsWith("/preenrich-reset") && req.method === "DELETE") {
        await this.state.storage.delete("_preenrich_cache");
        return json({ status: "ok", cleared: true });
      }
      if (path.endsWith("/preenrich") && req.method === "POST") {
        return this.preenrich(req);
      }
      if (path.endsWith("/report") && req.method === "GET") {
        const obj = await this.env.CARDS.get(REPORT_KEYS.report());
        if (!obj) return json({ status: "error", errors: [{ code: "NOT_FOUND", message: "report.json not found" }] }, 404);
        return new Response(await obj.text(), { headers: { "content-type": "application/json" } });
      }

      if (path.endsWith("/generate") && req.method === "POST") {
        return this.generate(req);
      }
      if (path.endsWith("/avatars") && req.method === "POST") {
        return this.avatars(req);
      }
      if (path.endsWith("/publish") && req.method === "POST") {
        return this.publish(req);
      }
      if (path.startsWith(`/draft/`) && path.includes(`/report-card/`) && req.method === "GET") {
        const slugWithExt = decodeURIComponent(path.split("/report-card/")[1] || "");
        const slug = slugWithExt.replace(/\.jpg$/i, "");
        const key  = REPORT_KEYS.reportCard(slug); // "bristol-bloods-2025/cards/report/<slug>.jpg"

        const obj = await this.env.CARDS.get(key);
        if (!obj) return new Response("Not found", { status: 404 });

        return new Response(obj.body, {
          headers: {
            "content-type": "image/jpeg",
            "cache-control": "public, max-age=86400, s-maxage=86400"
          }
        });
      }
      return new Response("Not found", { status: 404 });
    } catch (e: any) {
      console.error("DO error", e && e.stack ? e.stack : e);
      return json({ status: "error", errors: [{ code: "UNCAUGHT", message: String(e?.message || e) }] }, 500);
    }
  }

  // ---------- uploads
  private async uploadCSV(req: Request, filename: string): Promise<Response> {
    const ctype = req.headers.get("content-type") || "";
    if (!ctype.includes("multipart/form-data")) {
      return json({ status: "error", errors: [{ code: "BAD_REQUEST", message: "Expected multipart/form-data" }] }, 400);
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return json({ status: "error", errors: [{ code: "BAD_SCHEMA", message: "Missing form field 'file'" }] }, 400);
    }
    const raw = await file.text();
    const { headers, rows } = parseCSV(raw);

    const required = filename === "master_eval_2025.csv" ? REQUIRED_MASTER_COLUMNS : REQUIRED_RESULTS_COLUMNS;
    const chk = hasColumns(headers, required);
    if (!chk.ok) return json({ status: "error", errors: [{ code: "BAD_SCHEMA", message: `Missing columns: ${chk.missing.join(", ")}` }] }, 400);

    await this.env.CARDS.put(REPORT_KEYS.inputs(filename), raw, { httpMetadata: { contentType: "text/csv" } });
    await this.state.storage.put(filename, { headers, rowsCount: rows.length, ts: Date.now() });

    return json({ status: "ok", rows: rows.length, columns: headers });
  }

  private async setKeepers(req: Request): Promise<Response> {
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.keepers)) {
      return json({ status: "error", errors: [{ code: "BAD_SCHEMA", message: "Expected { keepers: [...] }" }] }, 400);
    }
    // Compute overall if missing (12-team snake, for display)
    for (const k of body.keepers) {
      if (k.round == null || k.pick == null) {
        return json({ status: "error", errors: [{ code: "BAD_SCHEMA", message: "Keeper missing 'round' or 'pick'" }] }, 400);
      }
      k.overall = k.overall ?? ((k.round - 1) * 12 + k.pick);
    }
    await this.state.storage.put("keepers.json", { keepers: body.keepers, ts: Date.now() });
    await this.env.CARDS.put(REPORT_KEYS.inputs("keepers.json"), JSON.stringify({ keepers: body.keepers }, null, 2), { httpMetadata: { contentType: "application/json" } });
    return json({ status: "ok", count: body.keepers.length });
  }

  private async saveAliases(req: Request): Promise<Response> {
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.aliases)) {
      return json({ status: "error", errors: [{ code: "BAD_SCHEMA", message: "Expected { aliases: [...] }" }] }, 400);
    }
    const existing = (await this.state.storage.get("aliases.json")) as any || { aliases: [] };
    const merged = { aliases: [...existing.aliases, ...body.aliases], ts: Date.now() };
    await this.state.storage.put("aliases.json", merged);
    return json({ status: "ok", applied: body.aliases.length });
  }

  private async validateAll(): Promise<Response> {
    const masterMeta = await this.state.storage.get("master_eval_2025.csv");
    const resultsMeta = await this.state.storage.get("draft_results.csv");
    const keepers = await this.state.storage.get("keepers.json");

    const schema = { masterEval: !!masterMeta, draftResults: !!resultsMeta };
    if (!schema.masterEval || !schema.draftResults) {
      return json({ status: "error", errors: [{ code: "VALIDATION_BLOCKED", message: "Upload both Master Eval and Draft Results first." }] }, 400);
    }
    // Milestone 1: we’ll fill joins/sanity in the next step
    const joins = { matched: 0, unmatched: 0, examples: [] as any[] };
    const keeperStatus = { slotsOk: !!keepers, mappedCount: keepers ? (keepers as any).keepers?.length || 0 : 0 };
    const sanity = { earlyDbTeams: [] as string[], qbHoarder: [] as string[], byeWeekHellCandidate: null as any };

    return json({ status: "ok", schema, joins, keepers: keeperStatus, sanity });
  }

  private async preenrich(req: Request): Promise<Response> {
    try {
      const body = await req.json().catch(() => ({}));
      const settings = { ...DEFAULT_SETTINGS, ...(body?.settings || {}) };
      const weights = deepMerge(DEFAULT_WEIGHTS, body?.weights || {});

      // Load inputs from R2
      const [masterObj, resultsObj] = await Promise.all([
        this.env.CARDS.get(REPORT_KEYS.inputs("master_eval_2025.csv")),
        this.env.CARDS.get(REPORT_KEYS.inputs("draft_results.csv")),
      ]);
      if (!masterObj || !resultsObj) {
        return json(
          { status: "error", errors: [{ code: "NOT_READY", message: "Upload master_eval_2025.csv and draft_results.csv first" }] },
          400
        );
      }

      const masterTxt = await masterObj.text();
      const resultsTxt = await resultsObj.text();

      const master = parseCSV(masterTxt);
      const results = parseCSV(resultsTxt);

      // Build master index by (name|pos|team)
      const masterIdx = new Map<string, any>();
      for (const r of master.rows) {
        const key = `${normName(r["Player"])}|${mapPos(r["Position"]) || r["Position"]}|${(r["Team"] || "").toUpperCase()}`;
        masterIdx.set(key, {
          proj:      num(r["Proj FPTS"]),
          adp:       num(r["ADP"]),
          val:       num(r["Value"]),
          scarcity:  num(r["Positional Scarcity"]),
          riskFlags: (r["Risk Flags"] || "").split(/;|,|\|/).map(s => s.trim()).filter(Boolean),
          nfl:       (r["Team"] || "").toUpperCase(),
          pos:       mapPos(r["Position"]),
        });
      }

      // Replacement baselines by position (from master proj)
      const projByPos: Record<string, number[]> = {};
      for (const r of master.rows) {
        const p = mapPos(r["Position"]);
        const pj = num(r["Proj FPTS"]);
        if (!projByPos[p]) projByPos[p] = [];
        projByPos[p].push(pj);
      }
      Object.keys(projByPos).forEach(p => projByPos[p].sort((a,b)=>b-a));
      const rep: Record<string, number> = {};
      for (const p of Object.keys(settings.replacement)) {
        const rank = settings.replacement[p];
        const arr = projByPos[p] || [];
        rep[p] = arr[Math.min(rank - 1, Math.max(0, arr.length - 1))] || 0;
      }

      type EnrichedPick = {
        round: number; pick: number; overall: number;
        team: string; player: string; nfl: string; pos: string;
        proj: number; adp: number; adpDelta: number; value: number; scarcity: number;
        risk: string[]; lane: "OFF" | "IDP"; keeper: boolean;
      };

      const enriched: EnrichedPick[] = [];
      const unmatched: any[] = [];

      // Keepers (to tag)
      const keepers = ((await this.state.storage.get("keepers.json")) as any) || { keepers: [] };

      // Enrich picks (try unicorn positions where applicable)
      for (const row of results.rows) {
        const round = num(row["Round"]);
        const pick  = num(row["Pick"]);
        const overall = num(row["Overall"]);
        const player  = row["Player"];
        const nfl     = (row["NFL Team"] || "").toUpperCase();
        const draftedPos = mapPos(row["Pos"]);
        const team    = row["Fantasy Team"];

        const eligibles = UNICORNS[normName(player)] || [draftedPos];
        let best: EnrichedPick | null = null;

        for (const p of eligibles) {
          const m = masterIdx.get(`${normName(player)}|${p}|${nfl}`);
          if (!m) continue;

          const adp = isFiniteNum(m.adp) ? m.adp : synthADP(p, overall);
          const adpDelta  = overall - adp;
          const proj      = m.proj;
          const scarcity  = Math.max(proj - (rep[p] || 0), 0);
          const value     = adp > 0 ? proj / adp : 0;
          const lane: "OFF" | "IDP" = (p === 'LB' || p === 'DL' || p === 'DB') ? 'IDP' : 'OFF';
          const isKeeper = !!keepers.keepers?.some((k: any) => normName(k.player) === normName(player) && k.team === team);

          const candidate: EnrichedPick = {
            round, pick, overall, team, player, nfl, pos: p,
            proj, adp, adpDelta, value, scarcity, risk: m.riskFlags || [], lane, keeper: isKeeper
          };

          // Choose the structurally best eligible (more scarcity, break ties by projection)
          const structuralRank = scarcity * 1000 + proj;
          const bestRank = best ? best.scarcity * 1000 + best.proj : -Infinity;
          if (structuralRank > bestRank) best = candidate;
        }

        if (best) enriched.push(best);
        else unmatched.push({ player, pos: draftedPos, nfl, team, round, pick, overall });
      }

      // ---- Compute normalization arrays BEFORE using them
      const projArr = enriched.map(e => e.proj);
      const scaArr  = enriched.map(e => e.scarcity);
      const adpArr  = enriched.map(e => e.adpDelta); // positive => later than ADP (discount)
      const valArr  = enriched.map(e => e.value);

      // 5th–95th percentile anchors (more stable than 1–99)
      const p5  = { proj: pct(projArr, 0.05), sca: pct(scaArr, 0.05), adp: pct(adpArr, 0.05), val: pct(valArr, 0.05) };
      const p95 = { proj: pct(projArr, 0.95), sca: pct(scaArr, 0.95), adp: pct(adpArr, 0.95), val: pct(valArr, 0.95) };

      const sw = weights.grading.signalWeights;
      const mm = (x:number, a:number, b:number) => (a===b) ? 0.5 : Math.max(0, Math.min(1, (x-a)/(b-a)));

      function pickComposite(e: EnrichedPick): number {
        // Note: adpDelta used directly (positive good = steal, negative bad = reach)
        const Sp = Math.pow(mm(e.proj,     p5.proj, p95.proj), 1.25);
        const Ss = Math.pow(mm(e.scarcity, p5.sca,  p95.sca ), 1.25);
        const Sa = Math.pow(mm(e.adpDelta, p5.adp,  p95.adp ), 1.25);
        const Sv = Math.pow(mm(e.value,    p5.val,  p95.val ), 1.25);
        const inj = e.risk.some(r => /q|inj|out|hamstring|ankle|knee/i.test(r)) ? (weights.risk.injuryPenalty||0) : 0;
        const vol = e.risk.some(r => /vol/i.test(r)) ? (weights.risk.volatileAdpPenalty||0) : 0;
        return sw.projection*Sp + sw.scarcity*Ss + sw.adpDelta*Sa + sw.efficiency*Sv + inj + vol;
      }

      // Round/pos weights + lane throttle (extra cap/discount for IDP)
      const roundWeight = (r: number): number => (weights.grading.roundWeightCurve as any)[r] ?? 0.05;
      const posWeight   = (p: string): number => (weights.grading.posWeight as any)[p] ?? 1.0;
      const laneFactor = (lane: 'OFF'|'IDP') => lane === 'IDP' ? 0.30 : 1.0;

      const scored = enriched.map(e => {
        const base = pickComposite(e) * roundWeight(e.round) * posWeight(e.pos);
        return { e, score: base * laneFactor(e.lane) };
      });

      // Aggregate per team
      const byTeam = new Map<string, { picks: EnrichedPick[]; off: number; idp: number }>();
      for (const { e, score } of scored) {
        if (!byTeam.has(e.team)) byTeam.set(e.team, { picks: [], off: 0, idp: 0 });
        const t = byTeam.get(e.team)!;
        t.picks.push(e);
        if (e.lane === "OFF") t.off += score; else t.idp += score;
      }

      const teamsOut: any[] = [];
      const allPicks: { team: string; pick: EnrichedPick }[] = [];

      for (const [team, agg] of byTeam.entries()) {
        const idpAdj = Math.min(agg.idp, 2.0) * 0.30;
        const overall = agg.off + idpAdj;

        const isNoisyPos = (p: EnrichedPick) => p.lane === 'IDP' || p.pos === 'K';

        // Team callouts (exclude IDP/K from top steals/reaches)
        const steals = agg.picks
          .filter(p => isFiniteNum(p.adpDelta) && !isNoisyPos(p))
          .sort((a,b) => b.adpDelta - a.adpDelta)   // biggest positive = biggest steal
          .slice(0,3)
          .map(toPickRef(team));

        const reaches = agg.picks
          .filter(p => isFiniteNum(p.adpDelta) && !isNoisyPos(p))
          .sort((a,b) => a.adpDelta - b.adpDelta)   // biggest negative = biggest reach
          .slice(0,3)
          .map(toPickRef(team));

        const posCounts = agg.picks.reduce((acc: any, p) => { acc[p.pos] = (acc[p.pos] || 0) + 1; return acc; }, {});
        const meanAdpDelta = avg(agg.picks.map(p => p.adpDelta).filter(isFiniteNum));
        const sumValue     = sum(agg.picks.map(p => p.value));
        const sumScarcity  = sum(agg.picks.map(p => p.scarcity));
        const riskCount    = sum(agg.picks.map(p => ((p.risk?.length || 0) > 0 ? 1 : 0)));

        teamsOut.push({
          team,
          picks: agg.picks,
          metrics: { posCounts, meanAdpDelta, sumValue, sumScarcity, riskCount, stacks: [], byeClumps: [] },
          highlights: { steals, reaches, rosterFit: "", riskNote: "", idpNote: "" },
          scores: { offense: round2(agg.off), idp: round2(agg.idp), overall: round2(overall) },
          grades: { offense: "C", idp: "C", overall: "C" }, // filled below
        });

        for (const p of agg.picks) allPicks.push({ team, pick: p });
      }

      // Curve grades to room via quantiles
      const quantiles = (arr: number[], qs: number[]) => {
        if (arr.length === 0) return qs.map(() => 0);
        const a = [...arr].sort((x, y) => x - y);
        return qs.map(q => a[Math.max(0, Math.min(a.length - 1, Math.floor(q * (a.length - 1))))]);
      };
      const letterByCuts = (x: number, cuts: number[]) => {
        const [A, A_, Bp, B, B_, Cp, C, C_] = cuts;
        if (x >= A) return "A";
        if (x >= A_) return "A-";
        if (x >= Bp) return "B+";
        if (x >= B) return "B";
        if (x >= B_) return "B-";
        if (x >= Cp) return "C+";
        if (x >= C) return "C";
        if (x >= C_) return "C-";
        return "D";
      };

      const overallDist = teamsOut.map(t => t.scores.overall);
      const offDist     = teamsOut.map(t => t.scores.offense);
      const idpDist     = teamsOut.map(t => t.scores.idp);
      const qs = [0.9, 0.8, 0.7, 0.55, 0.45, 0.3, 0.2, 0.1];

      const [Ao, A_o, Bpo, Bo, B_o, Cpo, Co, C_o] = quantiles(offDist, qs);
      const [Ai, A_i, Bpi, Bi, B_i, Cpi, Ci, C_i] = quantiles(idpDist, qs);
      const [A , A_ , Bp , B , B_ , Cp , C , C_ ] = quantiles(overallDist, qs);

      for (const t of teamsOut) {
        t.grades = {
          offense: letterByCuts(t.scores.offense, [Ao, A_o, Bpo, Bo, B_o, Cpo, Co, C_o]),
          idp:     letterByCuts(t.scores.idp,     [Ai, A_i, Bpi, Bi, B_i, Cpi, Ci, C_i]),
          overall: letterByCuts(t.scores.overall, [A,  A_,  Bp,  B,  B_,  Cp,  C,  C_]),
        };
      }

      // League-level deterministic awards (use same reach/steal definition)
      const byDelta = allPicks.filter(x => isFiniteNum(x.pick.adpDelta));
      const stealPick = byDelta.sort((a,b) => b.pick.adpDelta - a.pick.adpDelta)[0]; // most positive
      const reachPick = byDelta.sort((a,b) => a.pick.adpDelta - b.pick.adpDelta)[0]; // most negative

      const leagueMetrics = {
        biggestReachCandidate: reachPick ? { team: reachPick.team, pick: toPickRef(reachPick.team)(reachPick.pick) } : null,
        stealCandidate:        stealPick ? { team: stealPick.team,  pick: toPickRef(stealPick.team)(stealPick.pick) } : null,
        byeOverlapWorst: null,
        qbHoarder: detectQBHoarders(teamsOut),
        thinRB:    detectThinRB(teamsOut),
        earlyDB:   detectEarlyDB(teamsOut),
      } as any;

      const resp = {
        status: "ok",
        summary: { teams: teamsOut.length, picks: enriched.length, unmatched: unmatched.length },
        unmatched,
        leagueMetrics,
        teams: teamsOut,
        diag: {
          scores: {
            overall: { min: Math.min(...overallDist), max: Math.max(...overallDist) },
            offense: { min: Math.min(...offDist),     max: Math.max(...offDist) },
            idp:     { min: Math.min(...idpDist),     max: Math.max(...idpDist) },
          },
          unicornsApplied: Object.keys(UNICORNS),
        },
      };

      await this.state.storage.put("_preenrich_cache", resp);
      return json(resp);
    } catch (e: any) {
      console.error("[preenrich] crash", e?.stack || e);
      return json({ status: "error", errors: [{ code: "UNCAUGHT", message: String(e?.message || e) }] }, 500);
    }
  }

  private async generate(req: Request): Promise<Response> {
    const pre = await this.runPreenrichSnapshot();
    if (pre.status !== "ok") return json(pre, 400);

    const compact = buildCompactPayload(pre);
    const sys = SYSTEM_PROMPT();
    const user = USER_PROMPT(compact);

    const endpoint = "https://api.openai.com/v1/chat/completions";
    const body = {
      model: "gpt-4o-mini",
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user }
      ]
    } as const;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${this.env.OPENAI_API_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const t = await res.text();
      return json({ status: "error", errors: [{ code: "OPENAI_ERROR", message: t }] }, 502);
    }

    const out = await res.json();
    const content = out.choices?.[0]?.message?.content || "{}";

    let obj: any;
    try { obj = JSON.parse(content); } catch {
      return json({ status: "error", errors: [{ code: "SCHEMA_VALIDATION_FAILED", message: "Model did not return valid JSON" }] }, 422);
    }

    const missing = requiredTopLevelKeys.filter(k => !(k in obj));
    if (missing.length) {
      return json({ status: "error", errors: [{ code: "SCHEMA_VALIDATION_FAILED", message: `Missing keys: ${missing.join(", ")}` }], modelOutputRaw: obj }, 422);
    }

    // Always refresh generatedAt
    obj.version     = obj.version     || "1.0.0";
    obj.draftId     = obj.draftId     || compact.draftId;
    obj.generatedAt = new Date().toISOString();

    // Merge grades/scores back in by team name so avatars get correct facial expressions
    const byTeam = new Map<string, { grades:any; scores:any }>(
      compact.teams.map(t => [String(t.team).toLowerCase(), { grades: t.grades, scores: t.scores }])
    );
    if (Array.isArray(obj.teams)) {
      obj.teams = obj.teams.map((t: any) => {
        const key = String(t.team || t.name || "").toLowerCase();
        const src = byTeam.get(key);
        return src ? { ...t, grades: t.grades || src.grades, scores: t.scores || src.scores } : t;
      });
    }

    // --- normalize leagueAwards.vibe into [{team, award}] using team.vibeAward
    obj.leagueAwards = obj.leagueAwards || {};
    const vibePairsFromTeams = Array.isArray(obj.teams)
      ? obj.teams
          .filter((t: any) => t?.team && t?.vibeAward)
          .map((t: any) => ({ team: t.team, award: t.vibeAward }))
      : [];

    if (vibePairsFromTeams.length) {
      obj.leagueAwards.vibe = vibePairsFromTeams;
    } else if (Array.isArray(obj.leagueAwards.vibe) && obj.leagueAwards.vibe.every((x: any) => typeof x === "string")) {
      // Fallback: pair in order with team list if model only gave strings
      obj.leagueAwards.vibe = obj.leagueAwards.vibe.map((award: string, i: number) => ({
        team: obj.teams?.[i]?.team ?? `Team ${i+1}`,
        award
      }));
    }

    await this.state.storage.put("modelOutput.json", obj);
    return json({ status: "ok", validated: true, modelOutput: obj });
  }

  // ------------------------
  // Helpers (preenrich snapshot)
  // ------------------------
  private async runPreenrichSnapshot(): Promise<any> {
    // If you persisted your preenrich output to storage in M2, you can read it here.
    // For now, we recompute by loading CSVs and running the same joins as in M2.
    const [masterObj, resultsObj] = await Promise.all([
      this.env.CARDS.get(`${REPORT_ROOT_PREFIX}/inputs/master_eval_2025.csv`),
      this.env.CARDS.get(`${REPORT_ROOT_PREFIX}/inputs/draft_results.csv`)
    ]);
    if (!masterObj || !resultsObj) return { status: "error", errors: [{ code: "NOT_READY", message: "Upload master_eval_2025.csv and draft_results.csv first" }] };

    // You should replace the next line with a call to your actual preenrich implementation
    // (e.g., this.preenrichInternal()) and return its JSON.
    return await this.state.storage.get("_preenrich_cache") || { status: "error", errors: [{ code: "NOT_READY", message: "Pre-enrich cache not present — wire preenrich to persist a snapshot" }] };
  }

  private async avatars(req: Request): Promise<Response> {
    const body = await req.json().catch(() => ({} as any));
    const personas: typeof PERSONAS = body?.personasOverride || PERSONAS;
    const faceMap: Record<string,string> = body?.gradeFaces || GRADE_FACE;

    // Prefer modelOutput grades; fall back to preenrich snapshot
    const model = (await this.state.storage.get("modelOutput.json")) as any;
    const pre   = (await this.state.storage.get("_preenrich_cache")) as any;
    const source = model?.teams?.length
      ? { type: "model", teams: model.teams }
      : pre?.teams?.length
        ? { type: "pre", teams: pre.teams }
        : null;
    if (!source) {
      return json({ status: "error", errors: [{ code: "NOT_READY", message: "Run /preenrich (or /generate) first" }] }, 400);
    }

    const glue = (s:string) => (s||"").toLowerCase().replace(/[^a-z0-9\s]/g,"").replace(/\s+/g," ").trim();

    // persona lookup: normalized persona.teamName -> personaKey
    const personaByTeamNorm = new Map<string, string>();
    for (const key of Object.keys(personas)) {
      const tn = glue(personas[key].teamName);
      if (tn) personaByTeamNorm.set(tn, key);
    }

    // ---- load aliases (stored or default)
    // Supported shapes in storage:
    //   { from: "Hock-Tua On This Dak", to: "Team Bad Luck" }
    //   { from: "Hock-Tua On This Dak", personaKey: "chino" }
    const stored = ((await this.state.storage.get("aliases.json")) as any)?.aliases ?? [];

    const aliasTeamToTeam = new Map<string,string>();   // glue(from) -> to(teamName)
    const aliasTeamToKey  = new Map<string,string>();   // glue(from) -> personaKey

    // defaults: team->team
    for (const [from, to] of Object.entries(DEFAULT_TEAM_ALIASES)) {
      aliasTeamToTeam.set(glue(from), to);
    }
    // defaults: team->persona key
    for (const [from, key] of Object.entries(DEFAULT_PERSONA_ALIASES)) {
      aliasTeamToKey.set(glue(from), key);
    }
    // user-provided
    for (const a of stored) {
      if (a?.from && a?.to) aliasTeamToTeam.set(glue(a.from), a.to);
      if (a?.from && a?.personaKey) aliasTeamToKey.set(glue(a.from), a.personaKey);
    }

    const written: string[] = [];
    const missing: string[] = [];
    const debugMappings: Array<{team:string, personaKey?:string, via:string}> = [];

    for (const t of source.teams) {
      const teamName: string = t.team || t.name || "";
      if (!teamName) continue;

      const slug  = teamSlug(teamName);
      const grade = String(t.grades?.overall || t.overallGrade || t.grade || "C");
      const face  = faceMap[grade] || "neutral";
      const g     = glue(teamName);

      // ----- resolve to a personaKey with robust matching + aliases
      let personaKey = aliasTeamToKey.get(g);
      let via = "aliasTeamToKey";

      if (!personaKey) {
        const aliasedTeam = aliasTeamToTeam.get(g);
        if (aliasedTeam) {
          const hit = personaByTeamNorm.get(glue(aliasedTeam));
          if (hit) { personaKey = hit; via = "aliasTeamToTeam"; }
        }
      }

      if (!personaKey) {
        const exact = personaByTeamNorm.get(g);
        if (exact) { personaKey = exact; via = "exactTeamMatch"; }
      }

      if (!personaKey) {
        const fuzzy = Object.entries(personas).find(([k,p]) => {
          const pn = glue(p.teamName);
          return pn && (g.includes(pn) || pn.includes(g));
        });
        if (fuzzy) { personaKey = fuzzy[0]; via = "fuzzyContains"; }
      }

      const persona = personaKey ? personas[personaKey] : null;
      if (!persona) { missing.push(teamName); continue; }
      debugMappings.push({ team: teamName, personaKey, via });

      // Build prompt (portrait-only)
      const prompt = buildAvatarPrompt({
        firstName: "",
        teamName: teamName,
        appearance: persona.appearance,
        motifs: persona.motifs,
        background: persona.background,
        face
      });

      // Try base photo (edits); fallback to pure generation
      let b64: string | undefined;

      try {
        const photoFileName = (PHOTO_FILES as any)[personaKey];
        if (photoFileName) {
          const photoUrl = `${PHOTOS_BASE}${photoFileName}`;
          const resp = await fetch(photoUrl);
          if (!resp.ok) throw new Error("no photo");
          const ab   = await resp.arrayBuffer();
          const mime = resp.headers.get("content-type") || "image/jpeg";
          const file = new File([ab], photoFileName, { type: mime });

          const form = new FormData();
          form.append("model", "gpt-image-1");
          form.append("prompt", [
            prompt,
            "Strict: no text, no jersey numbers, no watermarks; portrait only."
          ].join("\n"));
          form.append("size", "1024x1024");
          form.append("image", file);

          const ai = await fetch("https://api.openai.com/v1/images/edits", {
            method: "POST",
            headers: { authorization: `Bearer ${this.env.OPENAI_API_KEY}` },
            body: form
          });
          if (!ai.ok) throw new Error(`OpenAI edits ${ai.status}: ${await ai.text()}`);
          const data = await ai.json();
          b64 = data?.data?.[0]?.b64_json as string | undefined;
        }
      } catch {
        // fall through to pure gen
      }

      if (!b64) {
        const gen = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: { "authorization": `Bearer ${this.env.OPENAI_API_KEY}`, "content-type": "application/json" },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt: [
              prompt,
              "Strict: no text, no jersey numbers, no watermarks; portrait only."
            ].join("\n"),
            size: "1024x1024",
            n: 1
          })
        });
        if (!gen.ok) {
          const txt = await gen.text();
          return json({ status: "error", errors: [{ code: "OPENAI_ERROR", message: txt }] }, 502);
        }
        const data = await gen.json();
        b64 = data?.data?.[0]?.b64_json as string | undefined;
        if (!b64) return json({ status: "error", errors: [{ code: "OPENAI_ERROR", message: "No image payload in response" }] }, 502);
      }

      const bytes = b64ToUint8Array(b64);
      await this.env.CARDS.put(REPORT_KEYS.reportCard(slug), bytes, { httpMetadata: { contentType: "image/jpeg" } });
      written.push(REPORT_KEYS.reportCard(slug));
    }

    return json({ status: "ok", written, missingPersonas: missing, debugMappings });
  }

  // ------------------------
  // /publish — persist model output to R2 and verify all cards exist
  // ------------------------
  private async publish(req: Request): Promise<Response> {
    const model = (await this.state.storage.get("modelOutput.json")) as any;
    if (!model?.teams?.length) {
      return json({
        status: "error",
        errors: [{ code: "NOT_READY", message: "Run /generate first" }]
      }, 400);
    }

    // verify portraits exist for every team
    const missing: string[] = [];
    for (const t of model.teams) {
      const teamName: string = t.team || t.name || "";
      const slug = teamSlug(teamName);
      const head = await this.env.CARDS.head(REPORT_KEYS.reportCard(slug));
      if (!head) missing.push(teamName || slug);
    }

    if (missing.length) {
      return json({
        status: "error",
        errors: [{
          code: "AVATAR_GEN_FAILED",
          message: `Missing portraits for: ${missing.join(", ")}`
        }],
        missing
      }, 409);
    }

    // write report.json
    await this.env.CARDS.put(
      REPORT_KEYS.report(),
      JSON.stringify(model, null, 2),
      { httpMetadata: { contentType: "application/json" } }
    );

    return json({
      status: "ok",
      published: true,
      teams: model.teams.length,
      reportKey: REPORT_KEYS.report()
    });
  }
}

// ------------------------
// Small helpers (math, refs, detectors)
// ------------------------
function num(x: any): number { const n = Number(String(x).replace(/,/g, '')); return isNaN(n) ? 0 : n; }
function isFiniteNum(x:any){ return typeof x === 'number' && isFinite(x); }
function sum(a:number[]){ return a.reduce((s,v)=>s+(isFinite(v)?v:0),0); }
function avg(a:number[]){ return a.length ? sum(a)/a.length : 0; }
function round2(x:number){ return Math.round(x*100)/100; }

function deepMerge<T>(base:T, over:any): T {
  if (!over) return base;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const k of Object.keys(over)) {
    const v = (over as any)[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = deepMerge((out as any)[k], v);
    else out[k] = v;
  }
  return out;
}

function synthADP(pos: string, overall: number): number {
  // very light synthetic ADP if missing (IDP often missing). Bias to overall pick if present.
  const base = overall || 200;
  const bump = ({ LB: 140, DL: 160, DB: 170, K: 180 } as any)[pos] || 150;
  return base + bump * 0.1; // gentle nudge so deltas still meaningful
}

function toPickRef(team: string) {
  return (p: any) => ({ player: p.player, nfl: p.nfl, pos: p.pos, team, round: p.round, pick: p.pick, overall: p.overall, adp: p.adp, adpDelta: p.adpDelta });
}

function detectQBHoarders(teams: any[]): string[] {
  const out: string[] = [];
  for (const t of teams) {
    const qbs = t.picks.filter((p:any)=>p.pos==='QB');
    const early = qbs.filter((p:any)=>p.round <= 10);
    if (qbs.length >= 3 && early.length >= 2) out.push(t.team);
  }
  return out;
}
function detectThinRB(teams: any[]): string[] {
  const out: string[] = [];
  for (const t of teams) {
    const rbs = t.picks.filter((p:any)=>p.pos==='RB');
    const startersFilledBy8 = rbs.filter((p:any)=>p.round <= 8).length >= 2; // needs 2 starters
    const depthBy12 = rbs.filter((p:any)=>p.round <= 12).length >= 3; // at least 1 depth behind
    if (!startersFilledBy8 || !depthBy12) out.push(t.team);
  }
  return out;
}
function detectEarlyDB(teams: any[]): string[] {
  const out: string[] = [];
  for (const t of teams) {
    const firstIDP = t.picks.filter((p:any)=>p.pos==='LB'||p.pos==='DL'||p.pos==='DB').sort((a:any,b:any)=>a.overall-b.overall)[0];
    if (firstIDP && firstIDP.pos==='DB') out.push(t.team);
  }
  return out;
}

// ------------------------
// Prompt builders
// ------------------------
const requiredTopLevelKeys = ["version","draftId","generatedAt","teams","leagueAwards"] as const;

function SYSTEM_PROMPT(): string {
  return `You are generating a fantasy football draft report for the Bristol Bloods league.\n\nRules:\n- Do NOT change numeric grades. The numeric scores and letter grades are already computed.\n- Critique strategy and roster construction, not people. Keep roasts fun but not personal.\n- Keep outputs succinct and punchy.\n- Output JSON only. No prose outside of JSON.\n- Respect the provided JSON keys exactly. No extra keys.\n- If something is unclear, be conservative and avoid hallucinating specifics.\nMention IDP sparingly—call it out only if it’s clearly exceptional or affects a team’s starting lineup. Otherwise, focus comments on offense (QB/RB/WR/TE).\nIf a player has multi-position eligibility (e.g., Travis Hunter), assess them at their highest impact position for the league settings, and mention the flexibility briefly.\n"Copy through the provided per-team grades and numeric scores; do not invent or alter them."`;
}

function USER_PROMPT(compact: CompactPayload): string {
  return JSON.stringify({
    instruction: "Produce the final report JSON. Use grades as given. Fill in strengths, weaknesses, verdict, and vibe awards succinctly.",
    schemaShapeHint: {
      version: "1.0.0",
      draftId: compact.draftId,
      generatedAt: "<iso string>",
      teams: "TeamReport[]",
      leagueAwards: { deterministic: "object", vibe: "array" }
    },
    league: {
      draftId: compact.draftId,
      settings: compact.settings
    },
    inputs: {
      teams: compact.teams,            // contains team name, grades, highlights, brief metrics
      candidates: compact.candidates   // deterministic award candidates
    }
  });
}

// ------------------------
// Compact payload shape
// ------------------------
export type CompactPayload = {
  draftId: string;
  settings: any;
  teams: Array<{
    team: string;
    grades: { offense: string; idp: string; overall: string };
    scores: { offense: number; idp: number; overall: number };
    highlights: { steals: any[]; reaches: any[] };
    metrics: { posCounts: Record<string, number>; meanAdpDelta: number; riskCount: number };
  }>;
  candidates: any;
};

// Example builder — adapt to your M2 shape
function buildCompactPayload(pre: any): CompactPayload {
  const draftId = "2025-bristol-bloods";
  const teams = (pre.teams || []).map((t: any) => ({
    team: t.team,
    grades: t.grades,
    scores: t.scores,
    highlights: { steals: (t.highlights?.steals||[]), reaches: (t.highlights?.reaches||[]) },
    metrics: {
      posCounts: t.metrics?.posCounts || {},
      meanAdpDelta: t.metrics?.meanAdpDelta ?? 0,
      riskCount: t.metrics?.riskCount ?? 0
    }
  }));
  return {
    draftId,
    settings: {
      scoring: "PPR",
      starters: { QB:1, RB:2, WR:2, TE:1, FLEX:1, LB:1, DL:1, DB:1, K:1 },
      bench: 9
    },
    teams,
    candidates: pre.leagueMetrics || {}
  };
}

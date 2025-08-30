export interface Env {
  OPENAI_API_KEY: string;
  LEAGUE: DurableObjectNamespace;
  CARDS: R2Bucket;             
}

const LEAGUE_ID   = "bristol-bloods-2025";
const LEAGUE_SIZE = 12;
const R2_PREFIX   = `${LEAGUE_ID}/cards/`;

// Hosted on your GitHub Pages site (Step 1)
const PERSONAS_URL = "https://bristolbloods.com/personas/personas.json";
const PHOTOS_BASE  = "https://bristolbloods.com/photos/";

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
]);

function withCORS(resp: Response, origin: string | null) {
  const h = new Headers(resp.headers);
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    h.set("Access-Control-Allow-Origin", origin);
    h.append("Vary", "Origin");
  }
  return new Response(resp.body, { status: resp.status, headers: h });
}

// ---------------- Worker (HTTP edge) ----------------
export default {
  async fetch(req: Request, env: Env) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      const origin = req.headers.get("Origin");
      const h = new Headers({
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      });
      if (origin && ALLOWED_ORIGINS.has(origin)) {
        h.set("Access-Control-Allow-Origin", origin);
        h.append("Vary", "Origin");
      }
      return new Response(null, { status: 204, headers: h });
    }


    if (url.pathname === "/health") return new Response("ok");

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

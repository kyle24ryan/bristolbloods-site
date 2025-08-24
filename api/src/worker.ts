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

// ------------------ PIXAR PROMPTS ------------------
const PIXAR_PROMPTS: Record<string, string> = {
  kyle: `
Pixar Toy Story style 3D cartoon portrait poster of Kyle.
Big, soft-rendered features; full beard, black-rim glasses, baseball cap worn backwards, slightly stocky but not overweight.
Style: glossy, colorful Pixar character render, high detail, playful yet bold.
Square poster layout 1024x1024.
Background: matte black with faint dark-red bandana texture, softened into Pixar-like fabric.
Huge hand-painted red number {slot} (draft slot) dominant in the composition.
Bold white stencil text: "KYLE" at top.
Supporting title: "The Losing Edge" (team name).
Design vibe: fantasy football draft reveal card, like an animated movie poster.
Keep likeness to the base photo if provided, but rendered in Toy Story cartoon style. Make sure the character maintains the facial characteristics of the real photo.
DO NOT INCLUDE ANY OTHER PEOPLE IN IMAGE.
`.trim(),

  amy: `
Pixar Toy Story style 3D cartoon portrait poster of Amy.
Big, soft-rendered features; expressive eyes, slightly anxious but playful expression.
Style: glossy, colorful Pixar character render, high detail, whimsical yet bold.
Square poster layout 1024x1024.
Background: matte black with faint dark-red bandana texture, softened into Pixar-like fabric.
Huge hand-painted red number {slot} (draft slot) dominant in the composition.
Bold white stencil text: "AMY" at top.
Supporting title: "F My Fantasy Football Team" (team name).
Palette highlights: green (#66C010), navy (#002145).
Design vibe: fantasy football draft reveal card, like an animated movie poster.
Include subtle persona motifs: tiny cat or dog icon, leafy tree silhouette, TV screen glow.
Keep likeness to the base photo if provided, but rendered in Toy Story cartoon style. Make sure the character maintains the facial characteristics of the real photo.
`.trim(),

  james: `
Pixar Toy Story style 3D cartoon portrait poster of James.
Edgy, energetic look; tattoos visible, punk-rock hairstyle and confident grin, always rocks the backwards hat.
Style: glossy Pixar character render, high detail, bold and rebellious but still playful.
Square poster layout 1024x1024.
Background: matte black with faint dark-red bandana texture, softened into Pixar-like fabric.
Huge hand-painted red number {slot} (draft slot) dominant in the composition.
Bold white stencil text: "JAMES" at top.
Supporting title: "BAD NEWS FOR ERICA" (team name).
Palette highlights: blue (#007FC8), gold (#F0AE00).
Design vibe: fantasy football draft reveal card, like an animated movie poster.
Include subtle persona motifs: guitar or music note, soccer ball detail, tattoo-inspired texture.
Keep likeness to the base photo if provided, but rendered in Toy Story cartoon style. Make sure the character maintains the facial characteristics of the real photo.
`.trim(),

  jared: `
Pixar Toy Story style 3D cartoon portrait poster of Jared.
Smooth, polished features; confident, stylish expression, luxury vibe, not morbidly obese just a little extra.
Style: glossy Pixar character render, high detail, playful yet bold.
Square poster layout 1024x1024.
Background: matte black with faint dark-red bandana texture, softened into Pixar-like fabric.
Huge hand-painted red number {slot} (draft slot) dominant in the composition.
Bold white stencil text: "JARED" at top.
Supporting title: "Cocktails and Dreams" (team name).
Palette highlights: dark green (#1F3731), white (#FFFFFF).
Design vibe: fantasy football draft reveal card, like an animated movie poster.
Include subtle persona motifs: cocktail glass glow, luxury sneaker outline, casino/gambling chips.
Keep likeness to the base photo if provided, but rendered in Toy Story cartoon style. Make sure the character maintains the facial characteristics of the real photo.
`.trim(),

  chino: `
Pixar Toy Story style 3D cartoon portrait poster of Chino.
Soft-rendered features; oversized t-shirt but not fat maybe a little chub, slightly slouched, with a worried smirk that suggests he’s ready to throw in the towel.
Style: glossy, colorful Pixar character render, high detail, playful yet anxious.
Square poster layout 1024x1024.
Background: matte black with faint dark-red bandana texture, softened into Pixar-like fabric, with glowing stadium lights rising in the distance.
Huge hand-painted red number {slot} (draft slot) dominant in the composition.
Bold white stencil text: "CHINO" at top.
Supporting title: "Team Bad Luck" (team name).
Design vibe: fantasy football draft reveal card, like an animated movie poster.
Include subtle persona motifs: fishing line or hook, faint puff of smoke/weed leaf worked into the background texture, scattered sports logos crossed out or faded to hint at no true fandom.
Keep likeness to the base photo if provided, but rendered in Toy Story cartoon style. Make sure the character maintains the facial characteristics of the real photo.
`.trim(),

  justin: `
Pixar Toy Story style 3D cartoon portrait poster of Justin.
Soft-rendered features; shaved head, relaxed body language, with a carefree but intense expression.
Style: glossy, colorful Pixar character render, high detail, playful yet cool.
Square poster layout 1024x1024.
Background: matte black with faint dark-red bandana texture, softened into Pixar-like fabric, with subtle silhouettes of stripper poles and neon club lights.
Huge hand-painted red number {slot} (draft slot) dominant in the composition.
Bold white stencil text: "JUSTIN" at top.
Supporting title: "High Expectations" (team name).
Design vibe: fantasy football draft reveal card, like an animated movie poster.
Include subtle persona motifs: fishing rod detail, boat outline, faint turntables or DJ headphones blended into the background, smoky haze suggesting weed.
Keep likeness to the base photo if provided, but rendered in Toy Story cartoon style. Make sure the character maintains the facial characteristics of the real photo.
`.trim(),

  kristyn: `
Pixar Toy Story style 3D cartoon portrait poster of Kristyn.
Relaxed, friendly expression; subtle cannabis/flower power vibe (tasteful).
Style: glossy Pixar character render, high detail, playful yet calm.
Square poster layout 1024x1024.
Background: matte black with faint dark-red bandana texture, softened into Pixar-like fabric.
Huge hand-painted red number {slot} (draft slot) dominant in the composition.
Bold white stencil text: "KRISTYN" at top.
Supporting title: "Flower Power" (team name).
Palette highlights: green (#66C010), navy (#002145).
Design vibe: fantasy football draft reveal card, like an animated movie poster.
Include subtle persona motifs: small flower silhouette or leaf filigree.
Keep likeness to the base photo if provided, but rendered in Toy Story cartoon style. Make sure the character maintains the facial characteristics of the real photo.
`.trim(),

  ovi: `
Pixar Toy Story style 3D cartoon portrait poster of Ovi.
Soft-rendered features; lean build, casual posture, with a smirk that feels confident but carries a subtle edge of melancholy.
Style: glossy, colorful Pixar character render, high detail, playful yet reflective.
Square poster layout 1024x1024.
Background: matte black with faint dark-red bandana texture, softened into Pixar-like fabric, with a subtle Philadelphia Eagles stadium silhouette and faint mountain outline behind it.
Huge hand-painted red number {slot} (draft slot) dominant in the composition.
Bold white stencil text: "OVI" at top.
Supporting title: "Your Mom's Haus" (team name).
Design vibe: fantasy football draft reveal card, like an animated movie poster.
Include subtle persona motifs: hot sauce bottle detail, faint Husky dog silhouette, glowing laptop/code snippet texture, small Eagles logo woven into the background.
Keep likeness to the base photo if provided, but rendered in Toy Story cartoon style. Make sure the character maintains the facial characteristics of the real photo (tattoos visible, wearing a shirt).
`.trim(),

  erica: `
Pixar Toy Story style 3D cartoon portrait poster of Erica.
Soft-rendered features; sarcastic expression with a sideways smirk, playful but sharp personality shining through.
Style: glossy, colorful Pixar character render, high detail, bold yet witty.
Square poster layout 1024x1024.
Background: matte black with faint dark-red bandana texture, softened into Pixar-like fabric, with a subtle New Jersey / New York skyline silhouette in the distance.
Huge hand-painted red number {slot} (draft slot) dominant in the composition.
Bold white stencil text: "ERICA" at top.
Supporting title: "I DIGGS a CHUBB" (team name).
Design vibe: fantasy football draft reveal card, like an animated movie poster.
Include subtle persona motifs: small Giants logo detail, sarcastic “eye roll” motif woven faintly into the background texture.
Keep likeness to the base photo if provided, but rendered in Toy Story cartoon style. Make sure the character maintains the facial characteristics of the real photo.
`.trim(),

  tommy: `
Pixar Toy Story style 3D cartoon portrait poster of Tommy.
Soft-rendered features; beard, slicked-back medium-length hair, with visible chest hair under a casual shirt. Expression set in a confident, shit-eating grin.
Style: glossy, colorful Pixar character render, high detail, playful yet relaxed.
Square poster layout 1024x1024.
Background: matte black with faint dark-red bandana texture, softened into Pixar-like fabric, with subtle hospital iconography (heartbeat monitor line glow, faint cross silhouette) woven into the design.
Huge hand-painted red number {slot} (draft slot) dominant in the composition.
Bold white stencil text: "TOMMY" at top.
Supporting title: "PROJECT BADASS" (team name).
Design vibe: fantasy football draft reveal card, like an animated movie poster.
Include subtle persona motifs: fantasy football trophy icon, nurse scrubs pocket silhouette, playful hint of five small stars or icons (for his five kids).
Keep likeness to the base photo if provided, but rendered in Toy Story cartoon style. Make sure the character maintains the facial characteristics of the real photo.
`.trim(),

  travis: `
Pixar Toy Story style 3D cartoon portrait poster of Travis.
Clean-cut, sharp features; tuxedo with bow tie for a dapper, model-like appearance. Expression set in a serious, almost sarcastic glare.
Style: glossy, colorful Pixar character render, high detail, elegant yet playful.
Square poster layout 1024x1024.
Background: matte black with faint dark-red bandana texture, softened into Pixar-like fabric, with subtle travel motifs (airplane contrails, faint passport stamp textures) woven into the design.
Huge hand-painted red number {slot} (draft slot) dominant in the composition.
Bold white stencil text: "TRAVIS" at top.
Supporting title: "Protein Balls" (team name).
Design vibe: fantasy football draft reveal card, like an animated movie poster.
Include subtle persona motifs: luxury car silhouette, faint engineering blueprint lines, small girl dad detail like a toy block or tiny tiara.
Keep likeness to the base photo if provided, but rendered in Toy Story cartoon style. Make sure the character maintains the facial characteristics of the real photo.
`.trim(),

  mike: `
Pixar Toy Story style 3D cartoon portrait poster of Mike.
Strong, confident look with a tight beard and sharp features. Expression set in an intense but laid-back glare.
Style: glossy, colorful Pixar character render, high detail, bold yet cool.
Square poster layout 1024x1024.
Background: matte black with faint dark-red bandana texture, softened into Pixar-like fabric, with subtle New York sports motifs (faint Jets logo silhouette, Mets baseball stitching texture, NYC skyline hints).
Huge hand-painted red number {slot} (draft slot) dominant in the composition.
Bold white stencil text: "MIKE" at top.
Supporting title: "Hallin Ass" (team name).
Design vibe: fantasy football draft reveal card, like an animated movie poster.
Include subtle persona motifs: tattoo-inspired linework, faint mobster-movie silhouette (like a fedora or gangster outline) blended into the background.
Keep likeness to the base photo if provided, but rendered in Toy Story cartoon style. Make sure the character maintains the facial characteristics of the real photo.
`.trim()
};

// Fallback if we don’t have a specific persona prompt
function defaultPixarPrompt(firstName: string): string {
  return `
Pixar Toy Story style 3D cartoon portrait poster of ${firstName}.
Square 1024x1024 poster with matte black background and faint dark-red bandana texture.
Huge hand-painted red number {slot} (draft slot).
Bold white stencil text: "${firstName.toUpperCase()}" at top.
Fantasy football draft reveal card, like an animated movie poster.
Keep likeness to the base photo if provided.
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
    const base = PIXAR_PROMPTS[slug] || defaultPixarPrompt(firstName);
    const prompt = base.replace("{slot}", String(slot));

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
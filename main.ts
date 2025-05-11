import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { extname, join } from "https://deno.land/std@0.177.0/path/mod.ts";

interface Score {
  name: string;
  score: number;
  date: string;
}

const kv = await Deno.openKv();
const SCORES_KEY = ["scores"];
const MAX_SCORES = 200;

function isValidName(name: unknown): name is string {
  return typeof name === "string" && name.trim().length >= 1 && name.trim().length <= 20;
}

function isValidScore(score: unknown): score is number {
  return typeof score === "number" && score >= 0;
}

async function getScores(): Promise<Score[]> {
  const res = await kv.get<Score[]>(SCORES_KEY);
  return res.value ?? [];
}

async function saveScores(scores: Score[]) {
  if (scores.length > MAX_SCORES) {
    scores = scores.slice(0, MAX_SCORES);
  }
  await kv.set(SCORES_KEY, scores);
}

function getContentType(ext: string): string {
  switch (ext) {
    case ".html": return "text/html";
    case ".js": return "application/javascript";
    case ".css": return "text/css";
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".svg": return "image/svg+xml";
    case ".json": return "application/json";
    default: return "application/octet-stream";
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

serve(async (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/") {
    try {
      const file = await Deno.readTextFile(join("frontend", "index.html"));
      return new Response(file, { headers: { "Content-Type": "text/html" } });
    } catch {
      return new Response("index.html not found", { status: 404 });
    }
  }

  if (url.pathname.startsWith("/frontend/")) {
    try {
      const filePath = url.pathname.slice(1);
      const file = await Deno.readFile(filePath);
      const ext = extname(filePath);
      return new Response(file, { headers: { "Content-Type": getContentType(ext) } });
    } catch {
      return new Response("Not Found", { status: 404 });
    }
  }

  if (url.pathname === "/api/scores") {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (req.method === "GET") {
      const limit = parseInt(url.searchParams.get("limit") ?? "10");
      const sortField = url.searchParams.get("sort_field") || "score";
      const sortAsc = url.searchParams.get("sort_asc") === "true";

      if (!["name", "score", "date"].includes(sortField)) {
        return new Response(JSON.stringify({ error: "Invalid sort field" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let scores = await getScores();

      scores.sort((a, b) => {
        if (sortField === "date") {
          const da = new Date(a.date).getTime();
          const db = new Date(b.date).getTime();
          return sortAsc ? da - db : db - da;
        }
        if (sortField === "name") {
          return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        if (sortField === "score") {
          return sortAsc ? a.score - b.score : b.score - a.score;
        }
        return 0;
      });

      scores = scores.slice(0, limit);

      return new Response(JSON.stringify(scores), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      try {
        const data = await req.json();

        if (!isValidName(data.name)) {
          return new Response(JSON.stringify({ error: "Invalid name" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (!isValidScore(data.score)) {
          return new Response(JSON.stringify({ error: "Invalid score" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const newScore: Score = {
          name: data.name.trim(),
          score: data.score,
          date: new Date().toISOString(),
        };

        const scores = await getScores();
        scores.push(newScore);
        scores.sort((a, b) => b.score - a.score);
        await saveScores(scores);

        return new Response(JSON.stringify(newScore), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  return new Response("Not Found", { status: 404 });
});

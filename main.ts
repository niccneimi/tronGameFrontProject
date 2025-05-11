import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
  const res = await kv.get<Scores>(SCORES_KEY);
  return res.value ?? [];
}

async function saveScores(scores: Score[]) {
  if (scores.length > MAX_SCORES) {
    scores = scores.slice(0, MAX_SCORES);
  }
  await kv.set(SCORES_KEY, scores);
}

serve(async (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/api/scores") {
    if (req.method === "GET") {
      const limitParam = url.searchParams.get("limit");
      const sortField = url.searchParams.get("sort_field") || "score";
      const sortAscParam = url.searchParams.get("sort_asc");

      const limit = limitParam ? parseInt(limitParam) : 10;
      const sortAsc = sortAscParam === "true";

      const validFields = new Set(["name", "score", "date"]);
      if (!validFields.has(sortField)) {
        return new Response(JSON.stringify({ error: "Invalid sort field" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      let scores = await getScores();

      scores.sort((a, b) => {
        if (sortField === "date") {
          const da = new Date(a.date);
          const db = new Date(b.date);
          return sortAsc ? da.getTime() - db.getTime() : db.getTime() - da.getTime();
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
        headers: { "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      try {
        const data = await req.json();

        if (!isValidName(data.name)) {
          return new Response(JSON.stringify({ error: "Invalid name" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        if (!isValidScore(data.score)) {
          return new Response(JSON.stringify({ error: "Invalid score" }), { status: 400, headers: { "Content-Type": "application/json" } });
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
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
    }

    return new Response("Method Not Allowed", { status: 405 });
  }

  return new Response("Not Found", { status: 404 });
});

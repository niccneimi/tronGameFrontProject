import { serve } from "https://deno.land/std/http/server.ts";

interface Score {
  name: string;
  score: number;
  date: string;
}

let scores: Score[] = [];

serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET" && url.pathname === "/api/scores") {
    return new Response(JSON.stringify(scores), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "POST" && url.pathname === "/api/scores") {
    const data = await req.json();
    if (!data.name || typeof data.score !== "number" || data.score < 0) {
      return new Response("Invalid data", { status: 400 });
    }
    const score: Score = {
      name: data.name,
      score: data.score,
      date: new Date().toISOString(),
    };
    scores.push(score);
    return new Response(JSON.stringify(score), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Not found", { status: 404 });
});

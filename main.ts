import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(() => new Response("Hello from Deno Deploy!"));

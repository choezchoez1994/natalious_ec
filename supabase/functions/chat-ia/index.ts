// Edge Function: chat-ia
// Backend seguro del Chat IA del panel natalious.
// - Valida sesión + rol admin (nat_is_admin) antes de gastar la API key.
// - Recibe { question, history, snapshot } y llama a Groq (llama-3.3-70b).
// - La GROQ_API_KEY vive aquí como SECRET, nunca en el frontend.
//
// Despliegue:
//   supabase secrets set GROQ_API_KEY=gsk_...
//   supabase functions deploy chat-ia
//
// Runtime: Deno (Supabase Edge Functions).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    // 1) Autenticación: el JWT del usuario viaja en el header Authorization.
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "No autorizado." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return json({ error: "Sesión inválida." }, 401);

    // 2) Autorización: solo administradoras.
    const { data: isAdmin, error: adminErr } = await supabase.rpc("nat_is_admin");
    if (adminErr || !isAdmin) return json({ error: "Requiere rol de administradora." }, 403);

    // 3) Entrada.
    const { question, history, snapshot } = await req.json();
    if (typeof question !== "string" || !question.trim() || typeof snapshot !== "string") {
      return json({ error: "Faltan datos en la solicitud." }, 400);
    }

    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (!groqKey) return json({ error: "GROQ_API_KEY no está configurada en el servidor." }, 500);

    // 4) Prompt con contexto (regla anti-alucinación).
    const systemPrompt =
      `Eres el asistente del panel administrativo de natalious, una boutique de ropa ` +
      `deportiva en Ecuador. Respondes preguntas de la administradora sobre su negocio.\n\n` +
      `REGLAS:\n` +
      `- Responde EXCLUSIVAMENTE con la información del bloque <contexto>. No inventes datos.\n` +
      `- Si el dato no está en el contexto, dilo con claridad y sugiere reformular la pregunta.\n` +
      `- Responde en español, conciso y directo. Usa cifras exactas (montos en USD con $).\n` +
      `- Puedes mostrar costos, márgenes y utilidades: son datos internos del panel.\n` +
      `- Usa listas cortas cuando ayude. No repitas todo el contexto.\n\n` +
      `<contexto>\n${snapshot}\n</contexto>`;

    const hist = Array.isArray(history)
      ? history
          .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .slice(-6)
          .map((m: any) => ({ role: m.role, content: m.content }))
      : [];

    const messages = [
      { role: "system", content: systemPrompt },
      ...hist,
      { role: "user", content: question },
    ];

    // 5) Llamada a Groq (API compatible con OpenAI).
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        max_tokens: 1024,
        messages,
      }),
    });

    if (!groqRes.ok) {
      const detail = await groqRes.text();
      return json({ error: "El modelo no respondió: " + detail.slice(0, 200) }, 502);
    }

    const out = await groqRes.json();
    const answer = out?.choices?.[0]?.message?.content?.trim() ?? "";
    if (!answer) return json({ error: "El modelo devolvió una respuesta vacía." }, 502);

    return json({ answer });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Error interno." }, 500);
  }
});

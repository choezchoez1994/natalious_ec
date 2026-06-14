import { useEffect, useMemo, useRef, useState } from "react";
import { ACard, ASectionTitle } from "../../components/form";
import { Spinner } from "../../components/ui";
import { useCatalog } from "../../store/CatalogContext";
import { fetchOrders } from "../../services/orders";
import { fetchMovements } from "../../services/inventory";
import { askChat, buildSnapshot } from "../../services/chat";
import type { ChatMessage } from "../../services/chat";
import type { Movement, Order } from "../../lib/types";

// Web Speech API (no tipada en el DOM estándar): se accede de forma laxa.
const SpeechRecognitionImpl: any =
  (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
  null;

const SUGERENCIAS = [
  "¿Qué productos tienen stock bajo?",
  "¿Cuáles son los más vendidos?",
  "¿Cuántas órdenes pendientes hay?",
  "¿Cuál es el margen por producto?",
];

export function ChatIA() {
  const { products, categories, loading } = useCatalog();
  const [orders, setOrders] = useState<Order[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Carga órdenes y movimientos (el catálogo ya viene de useCatalog).
  useEffect(() => {
    Promise.all([fetchOrders(), fetchMovements()])
      .then(([o, m]) => {
        setOrders(o);
        setMovements(m);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudieron cargar los datos."))
      .finally(() => setDataLoading(false));
  }, []);

  const snapshot = useMemo(
    () => buildSnapshot({ products, categories, orders, movements }),
    [products, categories, orders, movements]
  );

  // Auto-scroll al último mensaje.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || sending) return;
    setError(null);
    const history = messages;
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setInput("");
    setSending(true);
    try {
      const answer = await askChat(q, history, snapshot);
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al consultar el asistente.");
    } finally {
      setSending(false);
    }
  }

  function toggleVoice() {
    if (!SpeechRecognitionImpl) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new SpeechRecognitionImpl();
    rec.lang = "es-EC";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev: any) => {
      const transcript = ev.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) setInput((prev) => (prev ? prev + " " : "") + transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  }

  if (loading || dataLoading) return <Spinner />;

  return (
    <div>
      <ASectionTitle
        kicker="IA"
        title="Chat IA"
        right={
          <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, color: "var(--ink)", opacity: 0.55 }}>
            Responde con los datos reales de tu tienda
          </span>
        }
      />

      <ACard style={{ padding: 0, overflow: "hidden" }}>
        <div ref={scrollRef} className="nat-chat-scroll">
          {messages.length === 0 ? (
            <div className="nat-chat-welcome">
              <p style={{ margin: "0 0 4px", fontFamily: "'Bodoni Moda',serif", fontStyle: "italic", fontSize: 20, color: "var(--ink)" }}>
                Pregúntame sobre tu negocio ✦
              </p>
              <p style={{ margin: 0, fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13.5, color: "var(--ink)", opacity: 0.6 }}>
                Catálogo, stock, órdenes, ventas, márgenes y movimientos. Solo respondo con tus datos.
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={"nat-chat-row " + (msg.role === "user" ? "is-user" : "is-ai")}>
                <div className="nat-chat-bubble">{msg.content}</div>
              </div>
            ))
          )}
          {sending && (
            <div className="nat-chat-row is-ai">
              <div className="nat-chat-bubble nat-chat-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
        </div>

        {error && <div className="nat-chat-error">{error}</div>}

        {messages.length === 0 && (
          <div className="nat-chat-chips">
            {SUGERENCIAS.map((s) => (
              <button key={s} type="button" className="nat-chat-chip" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          className="nat-chat-bar"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          {SpeechRecognitionImpl && (
            <button
              type="button"
              className={"nat-chat-mic" + (listening ? " is-on" : "")}
              onClick={toggleVoice}
              title={listening ? "Detener" : "Hablar"}
              aria-label="Entrada por voz"
            >
              {listening ? "●" : "🎤"}
            </button>
          )}
          <input
            className="nat-chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta…"
            disabled={sending}
          />
          <button type="submit" className="nat-btn-primary nat-chat-send" disabled={sending || !input.trim()}>
            {sending ? "…" : "Enviar"}
          </button>
        </form>
      </ACard>
    </div>
  );
}

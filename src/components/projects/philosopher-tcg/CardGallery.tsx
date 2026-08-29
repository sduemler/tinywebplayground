import { useEffect } from "react";
import "./philosopher-tcg.css";
import { PHILOSOPHERS } from "./data/cards";
import { FACTIONS } from "./data/factions";
import Card from "./Card";

// A flat review gallery that renders every card full-size, grouped by faction —
// independent of what's been pulled from packs. Used to proof the portraits and
// their framing. Mounted at /projects/philosopher-tcg/all.
export default function CardGallery() {
  // Same font injection the main app uses (Cormorant Garamond + IBM Plex Mono).
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    return () => {
      try {
        document.head.removeChild(link);
      } catch {
        /* noop */
      }
    };
  }, []);

  return (
    <div className="tcg-root">
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px 80px" }}>
        <header style={{ marginBottom: 28 }}>
          <a
            href="/projects/philosopher-tcg"
            className="tcg-back"
            style={{ display: "inline-block", marginBottom: 14 }}
          >
            ← Back to the game
          </a>
          <h1
            style={{
              fontFamily: "var(--serif)",
              color: "var(--ink)",
              fontSize: 38,
              fontWeight: 700,
              margin: "0 0 4px",
            }}
          >
            Card Index · All 50
          </h1>
          <p
            style={{
              fontFamily: "var(--mono)",
              color: "rgba(241,230,200,0.55)",
              fontSize: 13,
              margin: 0,
            }}
          >
            Every card rendered exactly as it appears in-game, grouped by faction.
            Review the portraits and their framing.
          </p>
        </header>

        {FACTIONS.map((f) => {
          const cards = PHILOSOPHERS.filter((c) => c.school === f.key);
          return (
            <section key={f.key} style={{ marginBottom: 44 }}>
              <h2
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 26,
                  fontWeight: 600,
                  color: f.color,
                  borderBottom: `1px solid ${f.color}55`,
                  paddingBottom: 8,
                  marginBottom: 22,
                }}
              >
                {f.label}{" "}
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                    color: "rgba(241,230,200,0.4)",
                  }}
                >
                  {cards.length} cards
                </span>
              </h2>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 28,
                  justifyContent: "flex-start",
                }}
              >
                {cards.map((card) => (
                  <Card key={card.id} data={card} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

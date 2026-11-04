"use client";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { ideas } from "@/lib/templates";
import { kindInfo } from "@/lib/model";
export default function InspirationPage() {
  const [filter, setFilter] = useState("all");
  return (
    <div className="page-enter inspiration-page">
      <div className="page-heading">
        <div>
          <h1>Inspirasjon</h1>
          <p>Hva kan ligge bak en luke?</p>
        </div>
      </div>
      <div className="filter-tabs" aria-label="Velg type inspirasjon">
        {[
          ["all", "Alle"],
          ["giftcard", "Gavekort"],
          ["message", "Hilsener"],
          ["activity", "Opplevelser"],
          ["image", "Bilder"],
          ["quiz", "Quiz"],
          ["video", "Video"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={filter === value ? "active" : ""}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="ideas-grid">
        {ideas.map((idea, index) =>
          filter === "all" || filter === idea.kind ? (
            <article
              className={`idea-card ${idea.kind === "giftcard" ? "gift-idea" : ""}`}
              id={`idea-${index}`}
              key={idea.title}
            >
              <div className="idea-copy">
                <span className={`idea-icon tone-${index % 4}`}>
                  <Icon name={idea.icon} size={24} />
                </span>
                <span className="idea-category">
                  {kindInfo[idea.kind].name}
                </span>
                <h2>{idea.title}</h2>
                <p>{idea.body}</p>
              </div>
              {idea.kind === "giftcard" && (
                <>
                  <div className="gift-example">
                    <span>EKSEMPEL · 4. DESEMBER</span>
                    <strong>100 kr</strong>
                    <span>Gavekort på matlevering</span>
                    <Icon name="gift" size={35} />
                  </div>
                  <p className="field-help">
                    Du kan legge inn egne gavekort nå. Direkte kjøp i Luke er
                    ikke tilgjengelig ennå.
                  </p>
                </>
              )}
            </article>
          ) : null,
        )}
      </div>
    </div>
  );
}

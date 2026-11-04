"use client";
import { useState } from "react";
import { Artwork } from "@/components/artwork";
import { Icon } from "@/components/icons";
import { startNew } from "@/components/new-calendar";
import { Dialog } from "@/components/dialog";
import {
  templates,
  templateDoors,
  ideas,
  type TemplateId,
} from "@/lib/templates";
import { kindInfo } from "@/lib/model";
export default function InspirationPage() {
  const [preview, setPreview] = useState<TemplateId | null>(null);
  const template = templates.find((t) => t.id === preview);
  const [filter, setFilter] = useState("all");
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <p className="eyebrow">GODE IDEER VOKSER NÅR DE DELES</p>
          <h1>En liten dose inspirasjon.</h1>
          <p>
            Du trenger ikke finne på alt selv. Lån en idé, og gjør den til din.
          </p>
        </div>
        <span className="heading-decoration" aria-hidden="true">
          ✧
        </span>
      </div>
      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Et fint sted å begynne</h2>
            <p>
              24 forslag i hver mal. Bytt ut, legg til og sett ditt eget preg på
              den.
            </p>
          </div>
        </div>
        <div className="template-grid">
          {templates.map((t) => (
            <article className="template-card" key={t.id}>
              <button
                className={`template-art theme-${t.theme}`}
                aria-label={`Se innholdet i ${t.title}`}
                onClick={() => setPreview(t.id)}
              >
                <Artwork theme={t.theme} />
                <span className="template-label">{t.label}</span>
                <span className="template-art-title">{t.title}</span>
              </button>
              <div className="template-body">
                <h3>{t.title}</h3>
                <p>{t.description}</p>
                <div className="template-actions">
                  <button
                    className="button secondary small-button"
                    onClick={() => startNew(t.id)}
                  >
                    Bruk malen <Icon name="arrow" size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Se alle 24 forslag i ${t.title}`}
                    onClick={() => setPreview(t.id)}
                  >
                    <Icon name="eye" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LITT AV DET ENKLESTE ER DET FINESTE</p>
            <h2>Hva kan ligge bak en luke?</h2>
          </div>
        </div>
        <div className="filter-tabs">
          {[
            ["all", "Alle ideer"],
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
                className="idea-card"
                id={`idea-${index}`}
                key={idea.title}
              >
                <span className={`idea-icon tone-${index % 4}`}>
                  <Icon name={idea.icon} size={24} />
                </span>
                <span className="eyebrow">{kindInfo[idea.kind].name}</span>
                <h3>{idea.title}</h3>
                <p>{idea.body}</p>
                <button className="text-link" onClick={() => startNew()}>
                  Lag noe personlig <Icon name="arrow" size={15} />
                </button>
              </article>
            ) : null,
          )}
        </div>
      </section>
      <div className="wide-note">
        <Icon name="heart" size={27} />
        <div>
          <h2>Det er tanken som gjør det fint.</h2>
          <p>
            Du trenger verken dyre gaver eller store planer. En setning som bare
            du kunne skrevet, kan være mer enn nok.
          </p>
        </div>
      </div>
      {template && (
        <Dialog wide title={template.title} onClose={() => setPreview(null)}>
          <div className="dialog-content">
            <p className="dialog-intro">
              {template.description} Her er alle de 24 forslagene du starter
              med.
            </p>
            <div className="template-door-list">
              {templateDoors(template.id).map((door) => (
                <div key={door.day}>
                  <span>{door.day}</span>
                  <div>
                    <small>{kindInfo[door.kind].name}</small>
                    <h3>{door.title}</h3>
                    <p>{door.body}</p>
                    {door.quiz && (
                      <p className="muted">
                        Svaralternativer: {door.quiz.options.join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="dialog-actions sticky-actions">
              <button
                className="button secondary"
                onClick={() => setPreview(null)}
              >
                Tilbake
              </button>
              <button
                className="button primary"
                onClick={() => {
                  const id = template.id;
                  setPreview(null);
                  startNew(id);
                }}
              >
                Bruk denne malen <Icon name="arrow" size={17} />
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

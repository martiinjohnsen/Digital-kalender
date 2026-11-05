"use client";
import { useState } from "react";
import { Artwork } from "@/components/artwork";
import { Icon } from "@/components/icons";
import { ideas } from "@/lib/templates";
import { kindInfo } from "@/lib/model";
export default function InspirationPage() {
  const [filter, setFilter] = useState("all");
  return (
    <div className="page-enter inspiration-page">
      <section className="inspiration-walkthrough" aria-labelledby="walkthrough-title">
        <div className="walkthrough-heading">
          <h1 id="walkthrough-title">Slik bruker du Luke</h1>
          <p>Velg utseende, fyll lukene og del kalenderen.</p>
        </div>
        <div className="walkthrough-grid">
          {[
            ["Velg utseendet", "Gi kalenderen et navn, og finn fargene og vintermotivet som passer deg."],
            ["Fyll lukene", "Legg inn en hilsen, et bilde, en quiz eller en liten overraskelse. Du bestemmer innholdet."],
            ["Del kalenderen", "Send en invitasjon. Mottakeren logger inn og åpner kalenderen sin, med oppdateringene dine underveis."],
          ].map(([title, body], index) => (
            <article className="walkthrough-card" key={title}>
              <div className="walkthrough-screen" role="img" aria-label={`Eksempel: ${title}`}>
                <ExampleScreen step={index} />
              </div>
              <div className="walkthrough-caption">
                <span className="walkthrough-number">{index + 1}</span>
                <div><h2>{title}</h2><p>{body}</p></div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <div className="page-heading inspiration-heading">
        <div>
          <h2>Inspirasjon</h2>
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
              className="idea-card uniform-idea-card"
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
            </article>
          ) : null,
        )}
      </div>
    </div>
  );
}


// Small interface examples stay in sync with the app's real scene artwork.
function ExampleScreen({ step }: { step: number }) {
  return (
    <div className={`example-screen example-step-${step} theme-advent`} aria-hidden="true">
      <div className="example-toolbar"><span>luke.</span><i /><i /><i /></div>
      {step === 0 ? (
        <div className="example-appearance">
          <div className="example-page-title">Utseende</div>
          <div className="example-scene"><Artwork scene={{ house: "classic", sky: "stars", trees: true, snowman: true, reindeer: false, lights: true, snowfall: false, wind: false, twinkle: false }} /></div>
          <div className="example-swatches">{["#8f739f", "#55776d", "#b8848e", "#d4b685", "#617793", "#a56c5a"].map((color, index) => <span style={{ background: color }} key={color}>{index === 0 && <Icon name="check" size={10} />}</span>)}</div>
          <div className="example-motifs"><span className="chosen">Hus</span><span>Hytte</span><span>Granskog</span></div>
        </div>
      ) : step === 1 ? (
        <div className="example-editor">
          <div className="example-page-title">4. desember <span>Lagret ✓</span></div>
          <div className="example-textbox"><small>Din hilsen</small><p>En liten pause, bare til deg.<br />I dag spanderer jeg kakao ♥</p></div>
          <div className="example-quiz"><div><Icon name="quiz" size={13} /><strong>Dagens lille quiz</strong><Icon name="more" size={13} /></div><p>Hva hører desember til?</p><span>En varm kopp kakao <Icon name="check" size={10} /></span><span>Et bad i sjøen</span></div>
          <div className="example-add"><span>+ Bilde</span><span>+ Gavekort</span><span>+ Opplevelse</span></div>
        </div>
      ) : (
        <div className="example-recipient">
          <div className="example-page-title">Desember med deg <small>Fra en som er glad i deg</small></div>
          <div className="example-scene"><Artwork scene={{ house: "cabin", sky: "stars", trees: true, snowman: false, reindeer: true, lights: true, snowfall: false, wind: false, twinkle: false }} /></div>
          <div className="example-doors">{Array.from({ length: 24 }, (_, index) => <span className={index < 3 ? "opened" : ""} key={index}>{index < 3 ? <Icon name="check" size={9} /> : index + 1}</span>)}</div>
        </div>
      )}
    </div>
  );
}

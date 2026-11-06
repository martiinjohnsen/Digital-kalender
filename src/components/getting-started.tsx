import { useId } from "react";
import { Artwork } from "./artwork";
import { Icon } from "./icons";
import { gettingStarted } from "@/lib/getting-started";

export function GettingStarted({ titleAs: Title = "h2" }: { titleAs?: "h1" | "h2" }) {
  const headingId = useId();
  return (
    <section className="inspiration-walkthrough" aria-labelledby={headingId}>
      <div className="walkthrough-heading">
        <Title id={headingId}>{gettingStarted.title}</Title>
        <p>{gettingStarted.description}</p>
      </div>
      <div className="walkthrough-grid">
        {gettingStarted.steps.map(({ title, body }, index) => (
          <article className="walkthrough-card" key={title}>
            <div className="walkthrough-screen" role="img" aria-label={`Eksempel: ${title}`}>
              <ExampleScreen step={index} />
            </div>
            <div className="walkthrough-caption">
              <span className="walkthrough-number">{index + 1}</span>
              <div><h3>{title}</h3><p>{body}</p></div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// Small interface examples stay in sync with the app's real scene artwork.
function ExampleScreen({ step }: { step: number }) {
  return (
    <div className={`example-screen example-step-${step} theme-advent`} aria-hidden="true">
      <div className="example-toolbar"><span>luke.</span>{step === 3 ? <b className="example-share">Del kalender ↗</b> : <><i /><i /><i /></>}</div>
      {step === 0 ? (
        <div className="example-login">
          <div className="example-login-mark"><Icon name="user" size={30} /></div>
          <div className="example-page-title">Velkommen til Luke</div>
          <p>Din egen kalender starter her.</p>
          <div className="example-google"><b>G</b>Fortsett med Google</div>
          <small>Ny her? Kontoen opprettes automatisk.</small>
        </div>
      ) : step === 1 ? (
        <div className="example-appearance">
          <div className="example-page-title">Opprett kalender</div>
          <div className="example-name"><small>Navn på kalenderen</small><span>Desember med deg</span></div>
          <div className="example-scene"><Artwork fit="cover" scene={{ house: "classic", sky: "stars", trees: true, snowman: true, reindeer: false, lights: true, snowfall: false, wind: false, twinkle: false }} /></div>
          <div className="example-swatches">{["#8f739f", "#55776d", "#b8848e", "#d4b685", "#617793", "#a56c5a"].map((color, index) => <span style={{ background: color }} key={color}>{index === 0 && <Icon name="check" size={10} />}</span>)}</div>
          <div className="example-motifs"><span className="chosen">Hus</span><span>Hytte</span><span>Granskog</span></div>
        </div>
      ) : step === 2 ? (
        <div className="example-editor">
          <div className="example-page-title">4. desember <span>Lagret ✓</span></div>
          <div className="example-textbox"><small>Din hilsen</small><p>En liten pause, bare til deg.<br />I dag spanderer jeg kakao ♥</p></div>
          <div className="example-quiz"><div><Icon name="quiz" size={13} /><strong>Dagens lille quiz</strong><Icon name="more" size={13} /></div><p>Hva hører desember til?</p><span>En varm kopp kakao <Icon name="check" size={10} /></span><span>Et bad i sjøen</span></div>
          <div className="example-add"><span>+ Bilde</span><span>+ Gavekort</span><span>+ Opplevelse</span></div>
        </div>
      ) : (
        <div className="example-recipient">
          <div className="example-page-title">Desember med deg <small>Fra en som er glad i deg</small></div>
          <div className="example-scene"><Artwork fit="cover" scene={{ house: "cabin", sky: "stars", trees: true, snowman: false, reindeer: true, lights: true, snowfall: false, wind: false, twinkle: false }} /></div>
          <div className="example-doors">{Array.from({ length: 4 }, (_, index) => <span className={index < 2 ? "opened" : ""} key={index}>{index + 1}{index < 2 && <Icon name="check" size={9} />}</span>)}</div>
        </div>
      )}
    </div>
  );
}

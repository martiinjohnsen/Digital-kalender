"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="recovery">
      <h1>Det stoppet litt opp.</h1>
      <p>
        Vi fikk ikke vist denne siden. Prøv igjen, eller gå tilbake til
        oversikten.
      </p>
      <button className="button primary" onClick={reset}>
        Prøv igjen
      </button>
      <a className="button secondary" href="/">
        Til oversikten
      </a>
    </div>
  );
}

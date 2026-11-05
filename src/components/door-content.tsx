"use client";
import { useState } from "react";
import { safeLink, youtubeId, type GiftCard } from "@/lib/model";
import { useStore } from "./provider";
import { Icon } from "./icons";

export function VideoBlock({ url, title }: { url: string; title: string }) {
  const [play, setPlay] = useState(false);
  const id = youtubeId(url);
  return play ? (
    <div className="video-frame">
      <iframe
        title={title}
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  ) : (
    <button className="video-consent" onClick={() => setPlay(true)}>
      <Icon name="video" size={34} />
      <strong>Spill av videoen</strong>
      <small>Videoen lastes fra YouTube når du trykker.</small>
    </button>
  );
}
export function GiftCardView({ gift }: { gift: GiftCard }) {
  const [revealed, setRevealed] = useState(false);
  const { toast } = useStore();
  const expiry = gift.expiresOn
    ? new Date(`${gift.expiresOn}T12:00:00Z`).toLocaleDateString("nb-NO")
    : "";
  return (
    <section className="gift-card-reveal">
      <Icon name="gift" size={30} />
      <span>Gavekort</span>
      <h3>{gift.merchant || "En liten gave"}</h3>
      <strong className="gift-amount">
        {gift.amount.toLocaleString("nb-NO")} kr
      </strong>
      {gift.code &&
        (revealed ? (
          <div className="gift-code">
            <code>{gift.code}</code>
            <button
              className="icon-button"
              aria-label="Kopier gavekortkode"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(gift.code);
                  toast("Gavekortkoden er kopiert.");
                } catch {
                  toast("Marker og kopier koden manuelt.");
                }
              }}
            >
              <Icon name="copy" size={18} />
            </button>
          </div>
        ) : (
          <button
            className="button secondary"
            onClick={() => setRevealed(true)}
          >
            <Icon name="eye" size={17} />
            Vis gavekortkode
          </button>
        ))}
      {safeLink(gift.url) && (
        <a
          className="button primary"
          href={safeLink(gift.url)!}
          target="_blank"
          rel="noopener noreferrer"
        >
          Åpne gavekortet
          <Icon name="external" size={16} />
        </a>
      )}
      {expiry && <p className="field-help">Utløpsdato: {expiry}</p>}
      <p className="field-help">
        Lagt inn av avsender. Vilkår og gyldighet følger gavekortet.
      </p>
    </section>
  );
}

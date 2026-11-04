"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { decodeCalendar } from "@/lib/share";
import type { AdventCalendar } from "@/lib/model";
import { RecipientView } from "@/components/recipient-view";
import { Icon } from "@/components/icons";
export default function ReceivePage() {
  const [calendar, setCalendar] = useState<AdventCalendar | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const read = () => {
      try {
        setCalendar(decodeCalendar(location.hash.slice(1)));
        setError("");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Kalenderen kunne ikke åpnes.",
        );
        setCalendar(null);
      }
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  if (error)
    return (
      <main className="recovery">
        <Icon name="gift" size={36} />
        <h1>Vi mangler litt av lenken</h1>
        <p>{error}</p>
        <Link href="/" className="button primary">
          Til Luke <Icon name="arrow" size={17} />
        </Link>
      </main>
    );
  return calendar ? (
    <RecipientView key={calendar.id} calendar={calendar} />
  ) : (
    <div className="loading-screen">
      <span className="loading-star">✳</span>
      <p>Åpner en liten adventsglede …</p>
    </div>
  );
}

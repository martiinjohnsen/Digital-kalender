"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { decodeCalendar } from "@/lib/share";
import type { AdventCalendar } from "@/lib/model";
import { receivedCopy, isReceived } from "@/lib/calendar-library";
import { RecipientView } from "@/components/recipient-view";
import { Icon } from "@/components/icons";
import { useStore } from "@/components/provider";
export default function ReceivePage() {
  const store = useStore();
  const [calendar, setCalendar] = useState<AdventCalendar | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    const read = () => {
      try {
        setCalendar(decodeCalendar(location.hash.slice(1)));
        setError("");
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Kalenderen kunne ikke åpnes.",
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
        <Link href="/calendars" className="button primary">
          Til Mine kalendere
          <Icon name="arrow" size={17} />
        </Link>
      </main>
    );
  if (!calendar)
    return (
      <main className="loading-screen">
        <Icon name="sparkles" size={28} />
        <p>Åpner kalenderen …</p>
      </main>
    );
  const existing = store.data.calendars.find(
    (item) =>
      isReceived(item) &&
      item.receivedSourceId === (calendar.receivedSourceId ?? calendar.id),
  );
  return (
    <RecipientView
      key={calendar.id + calendar.updatedAt}
      calendar={calendar}
      saved={!!existing}
      onSaveShared={() => {
        const copy = receivedCopy(calendar, existing);
        const ok = existing ? store.update(existing.id, copy) : store.add(copy);
        if (ok)
          store.toast(
            "Kalenderen ligger nå under Delt med meg i Mine kalendere.",
          );
      }}
    />
  );
}

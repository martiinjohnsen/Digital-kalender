"use client";
import Link from "next/link";
import { useStore } from "./provider";
import { isReceived } from "@/lib/calendar-library";
import { RecipientView } from "./recipient-view";
export function Preview({ id }: { id: string }) {
  const { data } = useStore();
  const calendar = data.calendars.find((c) => c.id === id);
  if (!calendar)
    return (
      <div className="empty-state">
        <h1>Kalenderen er ikke tilgjengelig</h1>
        <p>Den kan være fjernet, eller du mangler tilgang til den.</p>
        <Link className="button primary" href="/calendars">
          Til mine kalendere
        </Link>
      </div>
    );
  return <RecipientView calendar={calendar} owner={!isReceived(calendar)} />;
}

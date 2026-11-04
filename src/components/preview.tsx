"use client";
import Link from "next/link";
import { useStore } from "./provider";
import { RecipientView } from "./recipient-view";
export function Preview({ id }: { id: string }) {
  const { data } = useStore();
  const calendar = data.calendars.find((c) => c.id === id);
  if (!calendar)
    return (
      <div className="empty-state">
        <h1>Kalenderen finnes ikke på denne enheten</h1>
        <Link className="button primary" href="/calendars">
          Til mine kalendere
        </Link>
      </div>
    );
  return <RecipientView calendar={calendar} owner />;
}

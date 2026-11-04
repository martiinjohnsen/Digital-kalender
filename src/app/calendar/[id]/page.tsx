import { CalendarEditor } from "@/components/calendar-editor";
export default async function CalendarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CalendarEditor id={id} />;
}

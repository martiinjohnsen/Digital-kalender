import { Preview } from "@/components/preview";
export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Preview id={id} />;
}

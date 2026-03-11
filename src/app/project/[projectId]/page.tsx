import { redirect } from "next/navigation";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/project/${projectId}/calendar`);
}

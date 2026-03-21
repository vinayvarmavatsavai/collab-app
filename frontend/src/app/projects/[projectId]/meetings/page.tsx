import { redirect } from "next/navigation";

export default async function ProjectOverviewPage({
  params,
}: {
  params: { projectId: string };
}) {
  const { projectId } = params;

  redirect(`/projects/${projectId}/calendar`);
}
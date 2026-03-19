export type Project = {
  id: string;
  name: string;
  summary: string;
  members: string[];
};

export const mockProjects: Project[] = [
  {
    id: "901",
    name: "AI Model Optimization",
    summary: "Improve model latency and quality for production rollout.",
    members: ["vinay", "saanvi", "rahul", "nora"],
  },
  {
    id: "902",
    name: "Robotics Sensor Fusion",
    summary: "Fuse multi-sensor data streams for stable field navigation.",
    members: ["vinay", "arjun", "meera", "karthik"],
  },
];

export function getProjectById(projectId: string): Project {
  return (
    mockProjects.find((project) => project.id === projectId) ?? {
      id: projectId,
      name: `Project ${projectId}`,
      summary: "Project workspace",
      members: ["vinay"],
    }
  );
}

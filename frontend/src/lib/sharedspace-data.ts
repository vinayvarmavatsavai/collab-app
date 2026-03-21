export type SharedFileType = "doc" | "pdf" | "zip" | "image" | "sheet" | "other";

export type SharedFileItem = {
  id: string;
  name: string;
  type: SharedFileType;
  size: string;
  sharedBy: string;
  sharedAt: string;
  project: string;
  folder: string;
  folderId: string;
  pinned?: boolean;
  starred?: boolean;
  extension: string;
  description?: string;
  previewTitle?: string;
  previewText?: string;
};

export type SharedFolderItem = {
  id: string;
  name: string;
  itemCount: number;
  updatedAt: string;
  color: string;
};

export const sharedFolders: SharedFolderItem[] = [
  {
    id: "pitch-decks",
    name: "Pitch Decks",
    itemCount: 3,
    updatedAt: "Updated 2h ago",
    color: "#F1F1F1",
  },
  {
    id: "product-docs",
    name: "Product Docs",
    itemCount: 4,
    updatedAt: "Updated today",
    color: "#F5F5F5",
  },
  {
    id: "brand-assets",
    name: "Brand Assets",
    itemCount: 3,
    updatedAt: "Updated yesterday",
    color: "#EFEFEF",
  },
  {
    id: "contracts",
    name: "Contracts",
    itemCount: 2,
    updatedAt: "Updated 3d ago",
    color: "#F3F3F3",
  },
];

export const sharedFiles: SharedFileItem[] = [
  {
    id: "file-1",
    name: "SphereNet Product Requirement Doc",
    type: "doc",
    extension: "DOCX",
    size: "1.8 MB",
    sharedBy: "Vicky",
    sharedAt: "Today, 10:45 AM",
    project: "SphereNet MVP",
    folder: "Product Docs",
    folderId: "product-docs",
    pinned: true,
    starred: true,
    description: "Main PRD covering onboarding, explore, and collaboration flow.",
    previewTitle: "Product Requirement Summary",
    previewText:
      "This document explains the full SphereNet MVP scope including onboarding, startup discovery, collaboration requests, workspace flows, milestones, meetings, messaging, and shared file system planning.",
  },
  {
    id: "file-2",
    name: "Investor Pitch Deck v2",
    type: "pdf",
    extension: "PDF",
    size: "4.2 MB",
    sharedBy: "Harshith",
    sharedAt: "Today, 08:10 AM",
    project: "SphereNet MVP",
    folder: "Pitch Decks",
    folderId: "pitch-decks",
    pinned: true,
    description: "Latest pitch deck prepared for startup demo and investor outreach.",
    previewTitle: "Investor Pitch Deck",
    previewText:
      "Slides include problem statement, product vision, market opportunity, user journey, collaboration workspace features, monetization approach, rollout plan, and growth strategy.",
  },
  {
    id: "file-3",
    name: "App Screens Final",
    type: "image",
    extension: "PNG",
    size: "2.5 MB",
    sharedBy: "Jamie",
    sharedAt: "Yesterday",
    project: "SphereNet MVP",
    folder: "Brand Assets",
    folderId: "brand-assets",
    starred: true,
    description: "High fidelity mobile UI screens for the shared workspace flow.",
    previewTitle: "UI Preview Notes",
    previewText:
      "This asset pack contains final mobile screen exports for dashboard, explore, shared space, project workspace, meetings, and activity views.",
  },
  {
    id: "file-4",
    name: "Backend APIs Collection",
    type: "zip",
    extension: "ZIP",
    size: "12.4 MB",
    sharedBy: "Vasanth",
    sharedAt: "Yesterday",
    project: "SphereNet MVP",
    folder: "Product Docs",
    folderId: "product-docs",
    description: "Postman collection and API documentation exported together.",
    previewTitle: "Archive Preview",
    previewText:
      "ZIP includes API collections, route samples, request payloads, environment variables, and backend notes for collaboration, project, and applicant flows.",
  },
  {
    id: "file-5",
    name: "Collaboration Analytics",
    type: "sheet",
    extension: "XLSX",
    size: "936 KB",
    sharedBy: "Abhi",
    sharedAt: "2 days ago",
    project: "Growth Experiment",
    folder: "Product Docs",
    folderId: "product-docs",
    description: "Tracking engagement and collaboration conversion metrics.",
    previewTitle: "Analytics Sheet",
    previewText:
      "Sheet tracks signups, requests created, applicant conversion, accepted collaborations, workspace usage, and retention trends over time.",
  },
  {
    id: "file-6",
    name: "Founders Agreement Draft",
    type: "pdf",
    extension: "PDF",
    size: "1.1 MB",
    sharedBy: "Maharaja",
    sharedAt: "4 days ago",
    project: "Legal Setup",
    folder: "Contracts",
    folderId: "contracts",
    description: "Draft legal agreement shared for founder discussion.",
    previewTitle: "Agreement Draft",
    previewText:
      "Legal draft covering cofounder roles, equity split discussion points, responsibilities, confidentiality, and collaboration expectations.",
  },
  {
    id: "file-7",
    name: "Go-To-Market Pitch Short",
    type: "pdf",
    extension: "PDF",
    size: "2.1 MB",
    sharedBy: "Vicky",
    sharedAt: "Today, 11:20 AM",
    project: "SphereNet MVP",
    folder: "Pitch Decks",
    folderId: "pitch-decks",
    description: "Condensed pitch deck version for quick intro meetings.",
    previewTitle: "Short Pitch Deck",
    previewText:
      "Short version deck focused on value proposition, target audience, workflow design, MVP scope, and expansion path.",
  },
  {
    id: "file-8",
    name: "Problem Statement Notes",
    type: "doc",
    extension: "DOCX",
    size: "780 KB",
    sharedBy: "Harshith",
    sharedAt: "1 day ago",
    project: "SphereNet MVP",
    folder: "Pitch Decks",
    folderId: "pitch-decks",
    description: "Problem framing notes used before deck preparation.",
    previewTitle: "Problem Statement Notes",
    previewText:
      "Notes defining the collaboration problem, user pain points, productivity gaps, and the need for a startup collaboration workspace.",
  },
  {
    id: "file-9",
    name: "Logo Explorations",
    type: "image",
    extension: "PNG",
    size: "1.4 MB",
    sharedBy: "Jamie",
    sharedAt: "3 days ago",
    project: "Brand Refresh",
    folder: "Brand Assets",
    folderId: "brand-assets",
    description: "Early logo and symbol concepts for product branding.",
    previewTitle: "Logo Explorations",
    previewText:
      "Preview includes alternate mark styles, icon spacing studies, rounded mobile-friendly shapes, and color direction experiments.",
  },
  {
    id: "file-10",
    name: "NDA Draft v1",
    type: "pdf",
    extension: "PDF",
    size: "860 KB",
    sharedBy: "Maharaja",
    sharedAt: "5 days ago",
    project: "Legal Setup",
    folder: "Contracts",
    folderId: "contracts",
    description: "Initial NDA draft for external collaborators.",
    previewTitle: "NDA Draft",
    previewText:
      "Draft NDA for collaborators and startup members before sharing sensitive decks, strategy docs, and technical plans.",
  },
  {
    id: "file-11",
    name: "Collab Moodboard",
    type: "image",
    extension: "JPG",
    size: "1.9 MB",
    sharedBy: "Jamie",
    sharedAt: "Today, 12:30 PM",
    project: "Brand Refresh",
    folder: "Brand Assets",
    folderId: "brand-assets",
    description: "Reference visuals and style direction for the app visuals.",
    previewTitle: "Moodboard",
    previewText:
      "A visual set of reference images, UI moods, type direction, layout inspiration and collaborative creative direction.",
  },
];
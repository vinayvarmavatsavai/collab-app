// file: src/app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SphereNet",
    short_name: "SphereNet",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F6FB",
    theme_color: "#2D6BFF",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
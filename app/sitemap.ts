import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://rechtsfall-ki-mvp.r-k-com.chatgpt.site/",
      lastModified: new Date("2026-07-25"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}

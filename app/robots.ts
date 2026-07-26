import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/fallraum", "/api/"] },
    ],
    sitemap: "https://rechtsfall-ki-mvp.r-k-com.chatgpt.site/sitemap.xml",
    host: "https://rechtsfall-ki-mvp.r-k-com.chatgpt.site",
  };
}

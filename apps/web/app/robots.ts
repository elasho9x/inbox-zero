import type { MetadataRoute } from "next";
import { env } from "@/env";
import { isIndexingAllowed } from "@/utils/indexing";

export default function robots(): MetadataRoute.Robots {
  if (
    env.NEXT_PUBLIC_BRAND_NAME === "VINBOX" ||
    !isIndexingAllowed(env.NEXT_PUBLIC_BASE_URL)
  ) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/components",
    },
    sitemap: [
      `${env.NEXT_PUBLIC_BASE_URL}/sitemap.xml`,
      "https://docs.getinboxzero.com/sitemap.xml",
    ],
  };
}

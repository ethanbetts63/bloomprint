import type { Metadata } from "next";
import { SITE_URL } from "./seo";
import { ARTICLES } from "./articles";

export type RouteMetadata = {
  title: string;
  description?: string;
  path: string;
  ogType?: "website" | "article";
  ogImage?: string;
};

// Article route metadata is derived from the single article registry (lib/articles.ts).
const articleRoutes: Record<string, RouteMetadata> = Object.fromEntries(
  ARTICLES.map((article) => [
    `/articles/${article.slug}`,
    {
      title: article.seoTitle,
      description: article.description,
      path: `/articles/${article.slug}`,
      ogType: "article" as const,
    },
  ]),
);

const publicRoutes: Record<string, RouteMetadata> = {
  "/": {
    // The root title template does not apply to app/page.tsx, so this is the exact
    // homepage title. The brand suffix is intentionally omitted here.
    title: "Personalised Online Flower Delivery Australia",
    description:
      "Tell us the occasion, budget, and flower preferences. A local Australian florist designs a bouquet that fits.",
    path: "/",
    ogImage: "/og-images/og-homepage.webp",
  },
  "/florists": {
    title: "For Florists | Grow Your Revenue",
    description:
      "Extend your service beyond today's purchase. Offer scheduled deliveries and subscriptions - all without adding admin, complexity, or cost.",
    path: "/florists",
    ogImage: "/og-images/og-homepage.webp",
  },
  "/affiliates": {
    title: "Affiliates | Earn by Gifting",
    description:
      "Help your followers get a better deal on flower deliveries. Earn $5-$25 per delivery while giving your community $5 off their first bouquet.",
    path: "/affiliates",
    ogImage: "/og-images/og-affiliates.webp",
  },
  "/pricing": {
    title: "Flower Delivery Pricing",
    description:
      "Simple, transparent flower delivery pricing. Set your budget and a local Australian florist designs the bouquet, delivery included. Recurring subscriptions available too.",
    path: "/pricing",
  },
  "/flower-subscription": {
    title: "Flower Subscription Delivery in Australia",
    description:
      "Set up a recurring flower subscription designed by a local Australian florist. Choose your frequency and budget, pause anytime, and get fresh seasonal bouquets on repeat.",
    path: "/flower-subscription",
  },
  "/corporate-flower-subscriptions": {
    title: "Corporate Flower Subscriptions for Offices",
    description:
      "Recurring office flower delivery by local Australian florists. Set a workplace brief, budget, and weekly, fortnightly, or monthly schedule.",
    path: "/corporate-flower-subscriptions",
  },
  "/send-flowers-to-australia-from-overseas": {
    title: "Send Flowers to Australia from Overseas",
    description:
      "Send flowers to Australia from anywhere in the world. Set the occasion, budget, date, and preferences, and a local Australian florist delivers them.",
    path: "/send-flowers-to-australia-from-overseas",
  },
  "/birthday-flower-delivery": {
    title: "Birthday Flower Delivery",
    description:
      "Send fresh birthday flowers from local florists. Pick a date, set a budget, and we handle the rest with delivery included from $100.",
    path: "/birthday-flower-delivery",
    ogImage: "/og-images/og-birthday-flowers.webp",
  },
  "/valentines-day-flower-delivery": {
    title: "Valentine's Day Flower Delivery",
    description:
      "Send fresh Valentine's Day flowers from local florists. Set a budget, add preferences, and choose February 14.",
    path: "/valentines-day-flower-delivery",
  },
  "/mothers-day-flower-delivery": {
    title: "Mother's Day Flower Delivery",
    description:
      "Send fresh Mother's Day flowers from local florists. Set a budget, add preferences, and choose Mother's Day.",
    path: "/mothers-day-flower-delivery",
  },
  "/flower-delivery-perth": {
    title: "Flower Delivery Perth",
    description:
      "Fresh flower delivery in Perth from local florists. Pick a date, set a budget, and add your preferences.",
    path: "/flower-delivery-perth",
    ogImage: "/og-images/og-flower-delivery-perth.webp",
  },
  "/flower-delivery-melbourne": {
    title: "Flower Delivery Melbourne",
    description:
      "Fresh flower delivery in Melbourne from local florists. Pick a date, set a budget, and add your preferences.",
    path: "/flower-delivery-melbourne",
  },
  "/flower-delivery-sydney": {
    title: "Flower Delivery Sydney",
    description:
      "Fresh flower delivery in Sydney from local florists. Pick a date, set a budget, and add your preferences.",
    path: "/flower-delivery-sydney",
  },
  "/flower-delivery-brisbane": {
    title: "Flower Delivery Brisbane",
    description:
      "Fresh flower delivery in Brisbane from local florists. Pick a date, set a budget, and add your preferences.",
    path: "/flower-delivery-brisbane",
  },
  "/flower-delivery-adelaide": {
    title: "Flower Delivery Adelaide",
    description:
      "Fresh flower delivery in Adelaide from local florists. Pick a date, set a budget, and add your preferences.",
    path: "/flower-delivery-adelaide",
  },
  "/flower-delivery-hobart": {
    title: "Flower Delivery Hobart",
    description:
      "Fresh flower delivery in Hobart from local florists. Pick a date, set a budget, and add your preferences.",
    path: "/flower-delivery-hobart",
  },
  "/articles": {
    title: "Flower Delivery Guides",
    description:
      "Explore articles, insights, and guides on long-term floral planning, personal growth, and making sure you never forget the important stuff.",
    path: "/articles",
  },
  ...articleRoutes,
};

function metadataFromRoute(route: RouteMetadata): Metadata {
  const canonicalUrl = `${SITE_URL}${route.path}`;
  const imageUrl = route.ogImage
    ? route.ogImage.startsWith("http")
      ? route.ogImage
      : `${SITE_URL}${route.ogImage}`
    : `${SITE_URL}/og-images/og-homepage.webp`;

  return {
    title: route.title,
    description: route.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: route.title,
      description: route.description,
      type: route.ogType ?? "website",
      url: canonicalUrl,
      images: [imageUrl],
    },
    twitter: {
      card: "summary_large_image",
      title: route.title,
      description: route.description,
      images: [imageUrl],
    },
  };
}

/**
 * Raw content registry lookup — the single source of truth for a route's
 * title/description/ogImage/ogType. Used both for Next page metadata and for
 * the JSON-LD emitted by <JsonLd path="…" />, so the two never drift.
 */
export function getRouteContent(path: string): RouteMetadata | undefined {
  return publicRoutes[path];
}

export function getPathFromSlug(slug?: string[]) {
  if (!slug || slug.length === 0) {
    return "/";
  }

  return `/${slug.join("/")}`;
}

export function getRouteMetadata(path: string): Metadata {
  const route = publicRoutes[path];

  if (route) {
    return metadataFromRoute(route);
  }

  // Default deny: anything not in the registry above — checkout, the dashboard,
  // account pages and the ordering flow are noindexed. Adding a route to
  // publicRoutes is the deliberate act that makes it indexable.
  //
  // There used to be a noindexPrefixes list checked here, but both branches
  // returned exactly this, so the list never changed an outcome.
  return {
    title: "FutureFlower",
    robots: {
      index: false,
      follow: false,
    },
  };
}

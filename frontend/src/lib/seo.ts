export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.bloomprint.com.au';

export const SITE_NAME = 'Bloom Print';

const DEFAULT_IMAGE = '/og-images/og-homepage.webp';
const PUBLISHER_LOGO = '/favicon-512x512.png';

export function absoluteUrl(pathOrUrl: string): string {
  return new URL(pathOrUrl, SITE_URL).toString();
}

export function buildWebsiteSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: {
      '@id': `${SITE_URL}/#organization`,
    },
  };
}

export function buildOrganizationSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    description:
      'Australian flower delivery service where customers give their preferences and a florist designs a suitable bouquet.',
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(PUBLISHER_LOGO),
      width: 512,
      height: 512,
    },
    areaServed: [{ '@type': 'Country', name: 'Australia' }],
    sameAs: ['https://www.instagram.com/bloomprintapp/'],
    founder: {
      '@type': 'Person',
      name: 'Ethan Betts',
    },
  };
}

export function buildServiceSchema(options: {
  serviceType: string;
  name: string;
  description: string;
  areaServed?: object | object[];
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: options.serviceType,
    name: options.name,
    description: options.description,
    provider: {
      '@id': `${SITE_URL}/#organization`,
    },
    areaServed: options.areaServed ?? [{ '@type': 'Country', name: 'Australia' }],
  };
}

export function buildWebPageSchema(options: {
  title: string;
  description?: string;
  path: string;
  image?: string;
  type?: 'WebPage' | 'CollectionPage';
}): object {
  const url = absoluteUrl(options.path);

  return {
    '@context': 'https://schema.org',
    '@type': options.type ?? 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: options.title,
    ...(options.description ? { description: options.description } : {}),
    isPartOf: {
      '@id': `${SITE_URL}/#website`,
    },
    publisher: {
      '@id': `${SITE_URL}/#organization`,
    },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: resolveSchemaImage(options.image),
    },
  };
}

export function buildBreadcrumbSchema(items: { name: string; path: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildBreadcrumbItems(path: string, title: string): { name: string; path: string }[] {
  if (path === '/') {
    return [{ name: 'Home', path: '/' }];
  }

  if (path.startsWith('/articles/')) {
    return [
      { name: 'Home', path: '/' },
      { name: 'Articles', path: '/articles' },
      { name: cleanTitle(title), path },
    ];
  }

  return [
    { name: 'Home', path: '/' },
    { name: cleanTitle(title), path },
  ];
}

export function buildArticleSchema(options: {
  title: string;
  description?: string;
  path: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
}): object {
  const url = absoluteUrl(options.path);

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: cleanTitle(options.title),
    name: cleanTitle(options.title),
    ...(options.description ? { description: options.description } : {}),
    url,
    mainEntityOfPage: {
      '@id': `${url}#webpage`,
    },
    image: [resolveSchemaImage(options.image)],
    ...(options.datePublished ? { datePublished: options.datePublished } : {}),
    ...(options.dateModified ? { dateModified: options.dateModified } : {}),
    author: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(PUBLISHER_LOGO),
        width: 512,
        height: 512,
      },
    },
    isPartOf: {
      '@type': 'Blog',
      '@id': `${SITE_URL}/articles#blog`,
      name: `${SITE_NAME} Articles`,
      url: `${SITE_URL}/articles`,
    },
  };
}

export function buildStructuredData(options: {
  title: string;
  description?: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  noindex?: boolean;
  structuredData?: object | object[];
}): object[] {
  const schemas = normalizeStructuredData(options.structuredData).map((schema) =>
    enhanceSchema(schema, options),
  );

  if (options.canonicalPath && !options.noindex) {
    schemas.unshift(
      buildWebPageSchema({
        title: options.title,
        description: options.description,
        path: options.canonicalPath,
        image: options.ogImage,
        type: getPageType(options.canonicalPath),
      }),
    );

    if (options.canonicalPath !== '/') {
      schemas.push(
        buildBreadcrumbSchema(buildBreadcrumbItems(options.canonicalPath, options.title)),
      );
    }
  }

  return schemas;
}

function normalizeStructuredData(structuredData?: object | object[]): object[] {
  if (!structuredData) return [];
  return Array.isArray(structuredData) ? structuredData : [structuredData];
}

function enhanceSchema(
  schema: object,
  options: {
    title: string;
    description?: string;
    canonicalPath?: string;
    ogType?: 'website' | 'article';
    ogImage?: string;
  },
): object {
  if (!isArticleSchema(schema) || !options.canonicalPath) {
    return schema;
  }

  const article = schema as Record<string, unknown>;

  return {
    ...buildArticleSchema({
      title: options.title,
      description: options.description,
      path: options.canonicalPath,
      image: getString(article.image) ?? options.ogImage,
      datePublished: getString(article.datePublished),
      dateModified: getString(article.dateModified),
    }),
    ...article,
    headline: cleanTitle(getString(article.headline) ?? options.title),
    name: cleanTitle(getString(article.name) ?? getString(article.headline) ?? options.title),
    image: [resolveSchemaImage(getString(article.image) ?? options.ogImage)],
    mainEntityOfPage: {
      '@id': `${absoluteUrl(options.canonicalPath)}#webpage`,
    },
    author: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(PUBLISHER_LOGO),
        width: 512,
        height: 512,
      },
    },
  };
}

function isArticleSchema(schema: object): boolean {
  const type = (schema as Record<string, unknown>)['@type'];
  return type === 'Article' || type === 'BlogPosting' || type === 'NewsArticle';
}

function getString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

function getPageType(path: string): 'WebPage' | 'CollectionPage' {
  if (path === '/articles') return 'CollectionPage';
  return 'WebPage';
}

function cleanTitle(title: string): string {
  return title.replace(/\s*\|\s*Bloom Print\s*$/i, '');
}

function resolveSchemaImage(pathOrUrl?: string): string {
  if (!pathOrUrl) return absoluteUrl(DEFAULT_IMAGE);
  if (pathOrUrl === DEFAULT_IMAGE || pathOrUrl.endsWith('/og-homepage.webp')) {
    return absoluteUrl(pathOrUrl);
  }

  if (pathOrUrl.includes('/og-images/') || pathOrUrl.includes('/static/og-images/')) {
    return absoluteUrl(DEFAULT_IMAGE);
  }

  return absoluteUrl(pathOrUrl);
}

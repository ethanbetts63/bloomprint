import { buildStructuredData, SITE_NAME } from '@/lib/seo';
import { getRouteContent } from '@/lib/routeMetadata';

/**
 * Emits page-level JSON-LD structured data ONLY. It does NOT set the page
 * <title>, meta description, or canonical — those come from Next's metadata API
 * (see lib/routeMetadata.ts). Title/description/ogImage/ogType are looked up from
 * the same route registry via `path`, so the schema never drifts from the <head>.
 *
 * Pass `structuredData` for extra page-specific schema (Service, Article, FAQ…).
 */
const JsonLd = ({
  path,
  structuredData,
}: {
  path: string;
  structuredData?: object | object[];
}) => {
  const route = getRouteContent(path);

  const schemas = buildStructuredData({
    title: route?.title ?? SITE_NAME,
    description: route?.description,
    canonicalPath: path,
    ogType: route?.ogType,
    ogImage: route?.ogImage,
    structuredData,
  });

  if (!schemas.length) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
    />
  );
};

export default JsonLd;

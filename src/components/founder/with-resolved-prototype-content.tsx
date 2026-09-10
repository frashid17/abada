import { PrototypeContentProvider } from "@/components/founder/prototype-content-provider";
import { getResolvedPrototypeContentSource } from "@/lib/documents/prototype/resolve-content";

/**
 * Wraps children with CMS prototype content only when published revisions exist.
 * Otherwise children use the client-bundled seed via context default — avoids
 * shipping ~175KB of seed JSON through the RSC → client flight payload.
 */
export async function WithResolvedPrototypeContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { content, fromCms } = await getResolvedPrototypeContentSource();
  if (!fromCms) return children;
  return <PrototypeContentProvider content={content}>{children}</PrototypeContentProvider>;
}

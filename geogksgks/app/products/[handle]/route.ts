import { serveProduct } from "@/lib/serve-product"

// Rendered on demand so edits saved from the dashboard are reflected instantly.
export const dynamic = "force-dynamic"

export async function GET(_request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  return serveProduct(decodeURIComponent(handle))
}

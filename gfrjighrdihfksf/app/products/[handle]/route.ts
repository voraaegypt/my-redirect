import { getProducts, serveProduct } from "@/lib/serve-product"

export const dynamic = "force-static"
export const dynamicParams = false

export async function generateStaticParams() {
  const products = await getProducts()
  return products.map((p) => ({ handle: p.handle }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  return serveProduct(decodeURIComponent(handle))
}

import { NextResponse } from "next/server"
import { getProduct, updateProduct, type ProductPatch } from "@/lib/products-db"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const product = await getProduct(decodeURIComponent(handle))
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }
  return NextResponse.json(product)
}

export async function PUT(request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const decodedHandle = decodeURIComponent(handle)

  let body: ProductPatch
  try {
    body = (await request.json()) as ProductPatch
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  // Allow-list the editable fields so unexpected keys can't be written.
  const patch: ProductPatch = {}
  if (typeof body.title === "string") patch.title = body.title
  if (typeof body.priceFormatted === "string") patch.priceFormatted = body.priceFormatted
  if (typeof body.description === "string") patch.description = body.description
  if (typeof body.available === "boolean") patch.available = body.available
  if (typeof body.image === "string" || body.image === null) patch.image = body.image

  const updated = await updateProduct(decodedHandle, patch)
  if (!updated) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }
  return NextResponse.json(updated)
}

import { NextResponse } from "next/server"
import { getProducts } from "@/lib/products-db"

export const dynamic = "force-dynamic"

export async function GET() {
  const products = await getProducts()
  return NextResponse.json(products)
}

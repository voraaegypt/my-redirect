import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

export type Product = {
  handle: string
  title: string
  priceFormatted: string
  description: string
  available: boolean
  image: string | null
}

const PRODUCTS_PATH = join(process.cwd(), "content", "products.json")

// Always read the file fresh so edits made through the dashboard are reflected
// immediately on the storefront without needing a server restart.
export async function getProducts(): Promise<Product[]> {
  const raw = await readFile(PRODUCTS_PATH, "utf-8")
  return JSON.parse(raw) as Product[]
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  const products = await getProducts()
  return products.find((p) => p.handle === handle)
}

async function saveProducts(products: Product[]): Promise<void> {
  await writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 1), "utf-8")
}

// Fields that may be edited from the dashboard. The handle is the stable unique
// id and is intentionally not editable.
export type ProductPatch = Partial<Omit<Product, "handle">>

export async function updateProduct(handle: string, patch: ProductPatch): Promise<Product | undefined> {
  const products = await getProducts()
  const index = products.findIndex((p) => p.handle === handle)
  if (index === -1) return undefined

  const updated: Product = { ...products[index], ...patch, handle }
  products[index] = updated
  await saveProducts(products)
  return updated
}

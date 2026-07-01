import { readFile } from "node:fs/promises"
import { join } from "node:path"

export type Product = {
  handle: string
  title: string
  priceFormatted: string
  description: string
  available: boolean
  image: string | null
}

// Values that are hard-coded in the saved product.html snapshot (the template
// was captured from the "Tangerine Maxine Desk Friend" product).
const TEMPLATE_TITLE = "Tangerine Maxine Desk Friend PREORDER"
const TEMPLATE_HANDLE = "tangerine-maxine-desk-friend"
const TEMPLATE_PRICE = "LE 3,332.90"

let productsCache: Product[] | null = null
let templateCache: string | null = null

export async function getProducts(): Promise<Product[]> {
  if (!productsCache) {
    const raw = await readFile(join(process.cwd(), "content", "products.json"), "utf-8")
    productsCache = JSON.parse(raw) as Product[]
  }
  return productsCache
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  const products = await getProducts()
  return products.find((p) => p.handle === handle)
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function replaceAll(haystack: string, needle: string, replacement: string): string {
  return haystack.split(needle).join(replacement)
}

// Swaps the template product's gallery photos with the current product image.
// Only large base64 images (the product photos) are replaced so the small
// header icons/logos are left untouched.
function replaceGalleryImages(headHtml: string, image: string): string {
  return headHtml.replace(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/g, (match) =>
    match.length > 10000 ? image : match,
  )
}

export async function renderProduct(product: Product): Promise<string> {
  if (!templateCache) {
    templateCache = await readFile(join(process.cwd(), "content", "product.html"), "utf-8")
  }
  let html = templateCache

  const safeTitle = escapeHtml(product.title)

  // 1. Title (used in <title>, og/twitter meta, <h1>, embedded product JSON).
  html = replaceAll(html, TEMPLATE_TITLE, safeTitle)

  // 2. Canonical/og handle + cart form handle -> unique product id.
  html = replaceAll(html, TEMPLATE_HANDLE, product.handle)

  // 3. Displayed price.
  html = replaceAll(html, `data-product-price>${TEMPLATE_PRICE}`, `data-product-price>${product.priceFormatted}`)

  // 4. Description (replace the inner HTML of the first RTE data-island).
  const descStart = html.indexOf('<data-island x-data=RTE class="rte text-left" ready>')
  if (descStart !== -1) {
    const open = html.indexOf(">", descStart) + 1
    const close = html.indexOf("</data-island>", open)
    if (close !== -1) {
      html = html.slice(0, open) + "\n" + product.description + "\n" + html.slice(close)
    }
  }

  // 5. Product gallery images (only the part of the page before the related
  // products section, so recommendations keep their own images).
  if (product.image) {
    const splitMarker = '<h1 class="font-heading heading-feature'
    const splitAt = html.indexOf(splitMarker)
    if (splitAt !== -1) {
      const head = replaceGalleryImages(html.slice(0, splitAt), product.image)
      html = head + html.slice(splitAt)
    }
  }

  return html
}

export async function serveProduct(handle: string): Promise<Response> {
  const product = await getProduct(handle)
  if (!product) {
    return new Response("Product not found", { status: 404 })
  }
  const html = await renderProduct(product)
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

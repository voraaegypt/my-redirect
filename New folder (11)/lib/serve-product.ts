import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { getProduct, getProducts, type Product } from "@/lib/products-db"

export type { Product }
export { getProduct, getProducts }

// Values that are hard-coded in the saved product.html snapshot (the template
// was captured from the "Tangerine Maxine Desk Friend" product).
const TEMPLATE_TITLE = "Tangerine Maxine Desk Friend PREORDER"
const TEMPLATE_HANDLE = "tangerine-maxine-desk-friend"
const TEMPLATE_PRICE = "LE 3,332.90"

// The template HTML never changes, so it is safe to cache it.
let templateCache: string | null = null

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

// The header/nav block (announcement bar, site header, search + cart drawers,
// mega menu) is shared, identical markup across every page on the site
// (home, featured, and every product page). It intentionally is NOT touched
// by the per-product substitutions below, so it always renders exactly the
// same regardless of which product page it's embedded in.
const HEADER_START_MARKER = "shopify-section-group-header-group"
const MAIN_START_MARKER = "shopify-section-template--21996246728952__main"

function getHeaderBounds(html: string): { start: number; end: number } | null {
  const groupIdx = html.indexOf(HEADER_START_MARKER)
  const mainIdx = html.indexOf(MAIN_START_MARKER)
  if (groupIdx === -1 || mainIdx === -1) return null
  const start = html.lastIndexOf("<div", groupIdx)
  if (start === -1 || start > mainIdx) return null
  return { start, end: mainIdx }
}

// Applies fn(segment) to the parts of html outside the shared header block,
// leaving the header block itself untouched.
function replaceOutsideHeader(html: string, fn: (segment: string) => string): string {
  const bounds = getHeaderBounds(html)
  if (!bounds) return fn(html) // fallback if markers ever change shape
  return fn(html.slice(0, bounds.start)) + html.slice(bounds.start, bounds.end) + fn(html.slice(bounds.end))
}

export async function renderProduct(product: Product): Promise<string> {
  if (!templateCache) {
    templateCache = await readFile(join(process.cwd(), "content", "product.html"), "utf-8")
  }
  let html = templateCache

  const safeTitle = escapeHtml(product.title)

  // 1. Title (used in <title>, og/twitter meta, <h1>, embedded product JSON).
  html = replaceOutsideHeader(html, (seg) => replaceAll(seg, TEMPLATE_TITLE, safeTitle))

  // 2. Canonical/og handle + cart form handle -> unique product id.
  html = replaceOutsideHeader(html, (seg) => replaceAll(seg, TEMPLATE_HANDLE, product.handle))

  // 3. Displayed price.
  html = replaceOutsideHeader(html, (seg) =>
    replaceAll(seg, `data-product-price>${TEMPLATE_PRICE}`, `data-product-price>${product.priceFormatted}`),
  )

  // 4. Description (replace the inner HTML of the first RTE data-island).
  const descStart = html.indexOf('<data-island x-data=RTE class="rte text-left" ready>')
  if (descStart !== -1) {
    const open = html.indexOf(">", descStart) + 1
    const close = html.indexOf("</data-island>", open)
    if (close !== -1) {
      html = html.slice(0, open) + "\n" + product.description + "\n" + html.slice(close)
    }
  }

  // 5. Product gallery images (only the part of the page between the end of
  // the header/nav and the start of the related products section, so the
  // header's own images and the recommendations keep their own images).
  if (product.image) {
    const bounds = getHeaderBounds(html)
    const startAt = bounds ? bounds.end : 0
    const splitMarker = '<h1 class="font-heading heading-feature'
    const splitAt = html.indexOf(splitMarker)
    if (splitAt !== -1 && startAt < splitAt) {
      const gallery = replaceGalleryImages(html.slice(startAt, splitAt), product.image)
      html = html.slice(0, startAt) + gallery + html.slice(splitAt)
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

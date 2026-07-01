import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { getProducts, type Product } from "@/lib/products-db"
import { ORIGINAL_SNAPSHOT } from "@/lib/listing-snapshot"

// content/home.html and content/featured.html are raw Shopify page snapshots:
// every product on the page is repeated several times in the markup (grid
// card, quick-buy data-island JSON, related-products carousel, etc). Rather
// than trying to re-template the whole page, we cache the original snapshot
// once and on every request swap the title / price / gallery image text for
// each product, everywhere it appears, so edits made in the dashboard show up
// on the storefront without needing to regenerate the snapshot by hand.
const templateCache = new Map<string, string>()

function replaceAll(haystack: string, needle: string, replacement: string): string {
  if (!needle) return haystack
  return haystack.split(needle).join(replacement)
}

// Matches the product's CDN photo URLs in both their normal ("//host/cdn/...")
// and JSON-escaped ("\/\/host\/cdn\/...") forms, wherever they show up near a
// product's title in the page.
const CDN_IMAGE_PATTERN =
  /(?:https?:)?(?:\\\/\\\/|\/\/)(?:www\.)?uncomfy\.store(?:\\\/|\/)cdn(?:\\\/|\/)shop(?:\\\/|\/)files(?:\\\/|\/)[^"'\\\s]+/g

// Replaces every CDN image URL that appears within `windowSize` characters of
// each occurrence of `anchor` in `html`. This keeps image swaps scoped to the
// product card/data-island they belong to instead of touching the whole page.
function swapImagesNearAnchor(html: string, anchor: string, newImage: string, windowSize = 6000): string {
  if (!anchor || !newImage) return html

  let result = ""
  let cursor = 0
  let searchFrom = 0

  while (true) {
    const anchorIndex = html.indexOf(anchor, searchFrom)
    if (anchorIndex === -1) break

    const windowStart = Math.max(cursor, anchorIndex)
    const windowEnd = Math.min(html.length, anchorIndex + anchor.length + windowSize)

    result += html.slice(cursor, windowStart)
    const segment = html.slice(windowStart, windowEnd)
    result += segment.replace(CDN_IMAGE_PATTERN, newImage)

    cursor = windowEnd
    searchFrom = anchorIndex + anchor.length
  }

  result += html.slice(cursor)
  return result
}

async function renderListing(fileName: string, products: Product[]): Promise<string> {
  let html = templateCache.get(fileName)
  if (!html) {
    html = await readFile(join(process.cwd(), "content", fileName), "utf-8")
    templateCache.set(fileName, html)
  }

  for (const product of products) {
    const original = ORIGINAL_SNAPSHOT[product.handle]
    if (!original) continue // product isn't featured on this page's snapshot

    if (original.title !== product.title) {
      html = replaceAll(html, original.title, product.title)
    }
    if (original.priceFormatted !== product.priceFormatted) {
      html = replaceAll(html, `data-product-price>${original.priceFormatted}`, `data-product-price>${product.priceFormatted}`)
      html = replaceAll(html, original.priceFormatted, product.priceFormatted)
    }
    if (product.image) {
      // Use the (possibly already-updated) title as the anchor so repeated
      // edits keep working, falling back to the handle which is stable.
      html = swapImagesNearAnchor(html, product.title, product.image)
      html = swapImagesNearAnchor(html, product.handle, product.image)
    }
  }

  return html
}

export async function serveListing(fileName: string): Promise<Response> {
  const products = await getProducts()
  const html = await renderListing(fileName, products)
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

// Snapshot of the title/price text exactly as they were originally captured
// in content/home.html and content/featured.html. These constants intentionally
// never change (do NOT regenerate this from products.json) -- they are the
// "find" side of a find/replace so that edits saved from the dashboard can be
// swapped in on every request, the same way lib/serve-product.ts does for the
// single product page template.
export const ORIGINAL_SNAPSHOT: Record<string, { title: string; priceFormatted: string }> = {
  "tangerine-maxine-desk-friend": { title: "Tangerine Maxine Desk Friend PREORDER", priceFormatted: "LE 3,415.24" },
  "apple-maxine-desk-friend": { title: "Apple Maxine Desk Friend PREORDER", priceFormatted: "LE 3,415.24" },
  "\u2728year-of-the-horse\u2728-keychain-preorder-copy": { title: "\u2728Year of the Horse\u2728 Keychain PREORDER", priceFormatted: "LE 3,415.24" },
  "matchabear-keychain-copy": { title: "Matcha Bear Keychain PREORDER", priceFormatted: "LE 3,415.24" },
  "fall-into-winter-coloring-book": { title: "Fall Into Winter Coloring Book", priceFormatted: "LE 525.30" },
  "preorder-strawberry-maxine-heatable-plush": { title: "Strawberry Maxine Heatable Plush", priceFormatted: "LE 2,101.72" },
  "tangerine-maxine-plushie-preorder": { title: "Tangerine Maxine Heatable Plush", priceFormatted: "LE 2,101.72" },
  "strawberry-cozy-bundle": { title: "Strawberry Cozy Bundle", priceFormatted: "LE 2,627.02" },
  "tangerine-cozy-bundle": { title: "Tangerine Cozy Bundle", priceFormatted: "LE 2,627.02" },
  "uncomfy-friends-coloring-book": { title: "Uncomfy & Friends Coloring Book", priceFormatted: "LE 919.67" },
  "book-bundle": { title: "Book Bundle", priceFormatted: "LE 1,287.12" },
  "november-pages-print-at-home": { title: "November Pages \u273f Print at Home!", priceFormatted: "LE 157.85" },
  "digital-downloads-summer-pages": { title: "Digital Downloads \u273f Summer Pages", priceFormatted: "LE 315.18" },
}

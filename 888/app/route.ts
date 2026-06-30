import { serveListing } from "@/lib/render-listing"

// Rendered on demand so edits saved from the dashboard (titles, prices,
// images) are reflected instantly on the homepage.
export const dynamic = "force-dynamic"

export function GET() {
  return serveListing("home.html")
}

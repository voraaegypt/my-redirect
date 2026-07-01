import { serveHtml } from "@/lib/serve-html"

export const dynamic = "force-static"

export function GET() {
  return serveHtml("home.html")
}

import { readFile } from "node:fs/promises"
import { join } from "node:path"

// Serves a raw saved HTML snapshot from the /content directory, untouched.
export async function serveHtml(fileName: string) {
  const filePath = join(process.cwd(), "content", fileName)
  const html = await readFile(filePath, "utf-8")

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  })
}

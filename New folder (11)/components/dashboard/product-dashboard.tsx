"use client"

import { useState } from "react"
import useSWR from "swr"
import { ImageIcon, Loader2, PackageSearch } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ProductEditor, type Product } from "@/components/dashboard/product-editor"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<Product[]>)

export function ProductDashboard() {
  const { data: products, isLoading, mutate } = useSWR<Product[]>("/api/products", fetcher)
  const [selected, setSelected] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  const activeHandle = selected ?? products?.[0]?.handle ?? null
  const activeProduct = products?.find((p) => p.handle === activeHandle) ?? null

  const filtered = (products ?? []).filter((p) => p.title.toLowerCase().includes(query.toLowerCase().trim()))

  function handleSaved(updated: Product) {
    // Optimistically update the local SWR cache with the saved product.
    mutate(
      (current) => (current ?? []).map((p) => (p.handle === updated.handle ? updated : p)),
      { revalidate: false },
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Product catalog</h1>
          {products ? <Badge variant="secondary">{products.length} items</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground text-pretty">
          Edit the images, titles, prices and descriptions stored in your products database. Changes are saved to{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">content/products.json</code> and appear on
          the storefront instantly.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Product list */}
        <aside className="flex flex-col gap-3">
          <Input
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
          />
          <div className="flex flex-col gap-2">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span className="text-sm">Loading products…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                <PackageSearch className="size-6" aria-hidden="true" />
                <span className="text-sm">No products match your search.</span>
              </div>
            ) : (
              filtered.map((product) => {
                const isActive = product.handle === activeHandle
                return (
                  <button
                    key={product.handle}
                    type="button"
                    onClick={() => setSelected(product.handle)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-2 text-left transition-colors",
                      isActive ? "border-primary bg-accent" : "border-border hover:bg-muted",
                    )}
                    aria-current={isActive}
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                      {product.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="size-5 text-muted-foreground" aria-hidden="true" />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{product.title}</span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{product.priceFormatted}</span>
                        <span aria-hidden="true">·</span>
                        <span className={product.available ? "text-foreground" : ""}>
                          {product.available ? "In stock" : "Sold out"}
                        </span>
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* Editor */}
        <Card className="p-5 md:p-6">
          {activeProduct ? (
            <ProductEditor key={activeProduct.handle} product={activeProduct} onSaved={handleSaved} />
          ) : (
            <div className="flex h-full min-h-64 items-center justify-center text-sm text-muted-foreground">
              {isLoading ? "Loading…" : "Select a product to edit."}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

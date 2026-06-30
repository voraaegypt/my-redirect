"use client"

import { useEffect, useRef, useState } from "react"
import { ImageIcon, Loader2, Save, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

export type Product = {
  handle: string
  title: string
  priceFormatted: string
  description: string
  available: boolean
  image: string | null
}

type Props = {
  product: Product
  onSaved: (product: Product) => void
}

export function ProductEditor({ product, onSaved }: Props) {
  const [form, setForm] = useState<Product>(product)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset the form whenever a different product is selected.
  useEffect(() => {
    setForm(product)
  }, [product])

  const dirty =
    form.title !== product.title ||
    form.priceFormatted !== product.priceFormatted ||
    form.description !== product.description ||
    form.available !== product.available ||
    form.image !== product.image

  function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, image: String(reader.result) }))
    reader.onerror = () => toast.error("Could not read that image.")
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(product.handle)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          priceFormatted: form.priceFormatted,
          description: form.description,
          available: form.available,
          image: form.image,
        }),
      })
      if (!res.ok) throw new Error("Save failed")
      const updated = (await res.json()) as Product
      onSaved(updated)
      toast.success("Product saved.")
    } catch {
      toast.error("Could not save the product.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Image preview */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex aspect-square w-40 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
            {form.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image || "/placeholder.svg"} alt={form.title} className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="size-8 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageFile(file)
              e.target.value = ""
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-4" aria-hidden="true" />
            Replace image
          </Button>
        </div>

        {/* Primary fields */}
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                value={form.priceFormatted}
                onChange={(e) => setForm((f) => ({ ...f, priceFormatted: e.target.value }))}
                placeholder="LE 0.00"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="available">Availability</Label>
              <div className="flex h-9 items-center gap-3">
                <Switch
                  id="available"
                  checked={form.available}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, available: checked }))}
                />
                <span className="text-sm text-muted-foreground">{form.available ? "In stock" : "Sold out"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="image-url">Image URL or data URI</Label>
            <Input
              id="image-url"
              value={form.image ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value || null }))}
              placeholder="https://… or data:image/…"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description (HTML)</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={10}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          {"HTML is rendered as-is on the product page. Tags like <p>, <strong> and <span> are supported."}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Unique ID: <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">{product.handle}</code>
        </p>
        <div className="flex items-center gap-2">
          <a
            href={`/products/${encodeURIComponent(product.handle)}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View page
          </a>
          <Button type="button" onClick={handleSave} disabled={!dirty || saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}

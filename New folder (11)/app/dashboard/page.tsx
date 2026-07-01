import type { Metadata } from "next"

import { ProductDashboard } from "@/components/dashboard/product-dashboard"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "Product Dashboard",
  description: "Manage product images, titles, prices and descriptions.",
}

export default function DashboardPage() {
  return (
    <main className="min-h-svh bg-background">
      <ProductDashboard />
      <Toaster richColors position="top-center" />
    </main>
  )
}

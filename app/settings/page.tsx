import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { SettingsForm } from "@/components/settings-form"

export default async function SettingsPage() {
  const user = await getSession()
  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Configuración</h1>
        <SettingsForm user={user} />
      </main>
    </div>
  )
}

import { RegisterForm } from "@/components/register-form"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function RegisterPage() {
  const user = await getSession()
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <RegisterForm />
    </div>
  )
}

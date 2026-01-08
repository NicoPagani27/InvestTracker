"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createWatchlist, deleteWatchlist } from "@/app/actions/investments"
import { Plus, Trash2, Loader2 } from "lucide-react"

interface WatchlistSelectorProps {
  watchlists: Array<{
    id: number
    name: string
    description: string | null
  }>
  selectedId: number
}

export function WatchlistSelector({ watchlists, selectedId }: WatchlistSelectorProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  function handleChange(value: string) {
    router.push(`/dashboard?watchlist=${value}`)
  }

  async function handleCreate(formData: FormData) {
    setIsCreating(true)
    await createWatchlist(formData)
    setIsCreating(false)
    setIsOpen(false)
  }

  async function handleDelete() {
    if (watchlists.length <= 1) return
    setIsDeleting(true)
    await deleteWatchlist(selectedId)
    setIsDeleting(false)
    router.push("/dashboard")
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={String(selectedId)} onValueChange={handleChange}>
        <SelectTrigger className="w-[200px] bg-card/50">
          <SelectValue placeholder="Seleccionar portafolio" />
        </SelectTrigger>
        <SelectContent>
          {watchlists.map((w) => (
            <SelectItem key={w.id} value={String(w.id)}>
              {w.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="bg-card/50">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Portafolio</DialogTitle>
            <DialogDescription>Crea un nuevo portafolio para organizar tus inversiones.</DialogDescription>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" placeholder="Mi nuevo portafolio" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea id="description" name="description" placeholder="Descripción del portafolio..." />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isCreating} className="bg-emerald-600 hover:bg-emerald-700">
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Crear Portafolio
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {watchlists.length > 1 && (
        <Button
          variant="outline"
          size="icon"
          className="bg-card/50 text-red-500 hover:text-red-600"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      )}
    </div>
  )
}

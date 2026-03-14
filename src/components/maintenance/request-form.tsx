"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import axios from "axios"
import { toast } from "sonner"
import { AlertCircle, Loader2 } from "lucide-react"

interface RequestFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function RequestForm({ open, onOpenChange, onSuccess }: RequestFormProps) {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [tenancies, setTenancies] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    unit_id: "",
    priority: "medium",
  })

  useEffect(() => {
    if (open) {
      const fetchTenancies = async () => {
        try {
          setLoading(true)
          const { data } = await axios.get("/api/tenant/dashboard")
          if (data.tenancies) {
            setTenancies(data.tenancies)
            // Auto-select if there is an active tenancy or just the first one
            const active = data.tenancies.find((t: any) => t.status === "active")
            if (active) {
              setFormData(prev => ({ ...prev, unit_id: active.unitId }))
            }
          }
        } catch (err) {
          console.error("Failed to fetch tenancies:", err)
        } finally {
          setLoading(false)
        }
      }
      fetchTenancies()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.unit_id) {
      toast.error("Please select a unit")
      return
    }

    try {
      setSubmitting(true)
      await axios.post("/api/maintenance", formData)
      toast.success("Maintenance request submitted successfully")
      onSuccess()
      onOpenChange(false)
      setFormData({
        title: "",
        description: "",
        unit_id: "",
        priority: "medium",
      })
    } catch (err) {
      console.error("Failed to submit request:", err)
      toast.error("Failed to submit maintenance request")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[32px] overflow-hidden p-0 border-border shadow-2xl bg-card">
        <div className="bg-linear-to-br from-blue-600 to-violet-600 p-8 text-white relative">
          <div className="absolute top-0 left-0 w-full h-full bg-black/10 pointer-events-none" />
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl font-black tracking-tight">New Maintenance Request</DialogTitle>
            <DialogDescription className="text-blue-100/90 font-medium">
              Describe the issue and our team will get to it as soon as possible.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unit" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Property / Unit</Label>
              <Select 
                value={formData.unit_id} 
                onValueChange={(val) => setFormData({ ...formData, unit_id: val })}
              >
                <SelectTrigger id="unit" className="rounded-2xl border-border bg-muted/30 h-14 focus:ring-blue-500 font-bold">
                  <SelectValue placeholder={loading ? "Loading units..." : "Select unit"} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border bg-card shadow-2xl p-2">
                  {tenancies.map((t: any) => (
                    <SelectItem key={t.id} value={t.unitId} className="rounded-xl py-3 px-3 cursor-pointer">
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-foreground">{t.propertyName}</span>
                        <span className="text-xs text-muted-foreground font-medium">{t.unitLabel}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tenancies.length === 0 && !loading && (
                <p className="text-[10px] text-red-500 font-black flex items-center gap-1 mt-1 uppercase tracking-wider">
                  <AlertCircle className="w-3 h-3" /> No active tenancies found.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Issue Title</Label>
              <Input
                id="title"
                placeholder="e.g., Leaking faucet in kitchen"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="rounded-2xl border-border bg-muted/30 h-14 focus:ring-blue-500 font-bold placeholder:text-muted-foreground/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="priority" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Priority Level</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(val) => setFormData({ ...formData, priority: val })}
                >
                  <SelectTrigger id="priority" className="rounded-2xl border-border bg-muted/30 h-14 focus:ring-blue-500 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border bg-card shadow-2xl p-2">
                    <SelectItem value="low" className="rounded-xl font-bold">Low</SelectItem>
                    <SelectItem value="medium" className="rounded-xl font-bold">Medium</SelectItem>
                    <SelectItem value="high" className="rounded-xl font-bold">High</SelectItem>
                    <SelectItem value="urgent" className="rounded-xl font-bold">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detailed Description</Label>
              <Textarea
                id="description"
                placeholder="Please describe the issue in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="rounded-[24px] border-border bg-muted/30 focus:ring-blue-500 min-h-[120px] p-4 text-sm font-medium placeholder:text-muted-foreground/30"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="rounded-2xl h-14 px-8 font-black text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || tenancies.length === 0}
              className="rounded-2xl h-14 px-10 font-black bg-foreground text-background hover:bg-foreground/90 shadow-xl shadow-foreground/10"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting
                </>
              ) : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

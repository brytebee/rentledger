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
      <DialogContent className="sm:max-w-[500px] rounded-3xl overflow-hidden p-0 border-0 shadow-2xl">
        <div className="bg-linear-to-br from-blue-600 to-violet-600 p-8 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">New Maintenance Request</DialogTitle>
            <DialogDescription className="text-blue-100/80">
              Describe the issue and our team will get to it as soon as possible.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unit" className="text-xs font-bold uppercase tracking-widest text-gray-400">Property / Unit</Label>
              <Select 
                value={formData.unit_id} 
                onValueChange={(val) => setFormData({ ...formData, unit_id: val })}
              >
                <SelectTrigger id="unit" className="rounded-xl border-gray-100 bg-gray-50/50 h-12 focus:ring-blue-500">
                  <SelectValue placeholder={loading ? "Loading units..." : "Select unit"} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-gray-100 shadow-xl p-2">
                  {tenancies.map((t: any) => (
                    <SelectItem key={t.id} value={t.unitId} className="rounded-xl py-3 px-3 cursor-pointer">
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-gray-900">{t.propertyName}</span>
                        <span className="text-xs text-gray-500 font-medium">{t.unitLabel}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tenancies.length === 0 && !loading && (
                <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> No active tenancies found.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-bold uppercase tracking-widest text-gray-400">Issue Title</Label>
              <Input
                id="title"
                placeholder="e.g., Leaking faucet in kitchen"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="rounded-xl border-gray-100 bg-gray-50/50 h-12 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="priority" className="text-xs font-bold uppercase tracking-widest text-gray-400">Priority Level</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(val) => setFormData({ ...formData, priority: val })}
                >
                  <SelectTrigger id="priority" className="rounded-xl border-gray-100 bg-gray-50/50 h-12 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-gray-100 shadow-xl p-2">
                    <SelectItem value="low" className="rounded-xl">Low</SelectItem>
                    <SelectItem value="medium" className="rounded-xl">Medium</SelectItem>
                    <SelectItem value="high" className="rounded-xl">High</SelectItem>
                    <SelectItem value="urgent" className="rounded-xl">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-gray-400">Detailed Description</Label>
              <Textarea
                id="description"
                placeholder="Please describe the issue in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="rounded-2xl border-gray-100 bg-gray-50/50 focus:ring-blue-500 min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-12 px-6 font-bold text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || tenancies.length === 0}
              className="rounded-xl h-12 px-8 font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

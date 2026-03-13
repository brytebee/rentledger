"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  MoreVertical,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Image as ImageIcon,
  Send,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import axios from "axios"
import { toast } from "sonner"

interface MaintenanceRequest {
  id: string
  title: string
  description: string
  status: "open" | "in_progress" | "resolved" | "rejected"
  priority: "low" | "medium" | "high" | "urgent"
  created_at: string
  unit: {
    name: string
    property: {
      name: string
    }
  }
  tenant: {
    full_name: string
  }
  landlord_comment?: string
}

interface MaintenanceListProps {
  requests: MaintenanceRequest[]
  loading: boolean
  onUpdate: () => void
  role?: "landlord" | "tenant"
}

const statusConfig = {
  open: {
    label: "Open",
    icon: AlertCircle,
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-700 border-green-200",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    color: "bg-red-100 text-red-700 border-red-200",
  },
}

function ReplyDialog({ 
  request, 
  open, 
  onClose, 
  onSuccess 
}: { 
  request: MaintenanceRequest | null, 
  open: boolean, 
  onClose: () => void, 
  onSuccess: () => void 
}) {
  const [comment, setComment] = useState(request?.landlord_comment || "")
  const [status, setStatus] = useState(request?.status || "open")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!request) return
    try {
      setLoading(true)
      await axios.patch(`/api/maintenance/${request.id}`, {
        status,
        landlord_comment: comment
      })
      toast.success("Response sent successfully")
      onSuccess()
      onClose()
    } catch (err) {
      console.error("Failed to send response:", err)
      toast.error("Failed to send response")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-3xl border-gray-100 shadow-2xl sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Reply to Request</DialogTitle>
          <DialogDescription className="text-sm">
            Update the status and provide feedback to the tenant.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Update Status</label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-gray-100">
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Comment</label>
            <Textarea 
              placeholder="Provide more details or instructions for the tenant..."
              className="min-h-[150px] rounded-2xl border-gray-100 bg-gray-50/50 p-4 focus:ring-blue-500"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} className="rounded-xl h-12">Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="rounded-xl h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 gap-2"
          >
            {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Response
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const priorityConfig = {
  low: { label: "Low", color: "bg-gray-100 text-gray-700" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
}

export function MaintenanceList({
  requests,
  loading,
  onUpdate,
  role,
}: MaintenanceListProps) {
  const [updating, setUpdating] = useState<string | null>(null)
  const [replyRequest, setReplyRequest] = useState<MaintenanceRequest | null>(null)

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setUpdating(id)
      await axios.patch(`/api/maintenance/${id}`, { status })
      toast.success(`Request status updated to ${status}`)
      onUpdate()
    } catch (err) {
      console.error("Failed to update status:", err)
      toast.error("Failed to update status")
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="rounded-2xl border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-gray-50">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <Skeleton className="h-20 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <Card className="rounded-3xl border-dashed border-2 border-gray-200 bg-gray-50/50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900 mb-2">
            No Maintenance Requests
          </CardTitle>
          <CardDescription className="text-gray-500 max-w-xs">
            {role === "landlord"
              ? "Your properties are in good shape! No issues reported."
              : "Everything looks good? You can report any maintenance issues here."}
          </CardDescription>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {requests.map((request) => {
        const status = statusConfig[request.status]
        const priority = priorityConfig[request.priority]
        const StatusIcon = status.icon

        return (
          <Card 
            key={request.id} 
            className={cn(
              "rounded-3xl border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden bg-white",
              updating === request.id && "opacity-50 pointer-events-none"
            )}
          >
            <div className={cn("h-1.5 w-full", {
              "bg-blue-500": request.status === "open",
              "bg-amber-500": request.status === "in_progress",
              "bg-green-500": request.status === "resolved",
              "bg-red-500": request.status === "rejected",
            })} />
            
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-[10px] uppercase tracking-wider font-bold h-5 px-2 rounded-full border-0", priority.color)}>
                      {priority.label}
                    </Badge>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                      {format(new Date(request.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {request.title}
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <span className="text-blue-600">{request.unit.property.name}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>Unit {request.unit.name}</span>
                  </CardDescription>
                </div>

                {role === "landlord" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full -mr-2">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-gray-100 shadow-2xl p-2 w-48">
                      <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-gray-400 px-3 pb-2">Actions</DropdownMenuLabel>
                      <DropdownMenuItem 
                        onClick={() => handleUpdateStatus(request.id, "in_progress")}
                        className="rounded-xl py-2.5 cursor-pointer focus:bg-amber-50 focus:text-amber-700"
                      >
                        <Clock className="w-4 h-4 mr-2" /> Mark In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleUpdateStatus(request.id, "resolved")}
                        className="rounded-xl py-2.5 cursor-pointer focus:bg-green-50 focus:text-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Resolved
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleUpdateStatus(request.id, "rejected")}
                        className="rounded-xl py-2.5 cursor-pointer focus:bg-red-50 focus:text-red-700"
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Reject Request
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-50" />
                      <DropdownMenuItem 
                        onClick={() => setReplyRequest(request)}
                        className="rounded-xl py-2.5 cursor-pointer focus:bg-blue-50 focus:text-blue-700"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" /> Reply & Update
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed bg-gray-50/50 p-4 rounded-2xl">
                {request.description}
              </p>

              {request.landlord_comment && (
                <div className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-2xl space-y-2">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Landlord's Response</p>
                  <p className="text-sm text-blue-900 leading-relaxed italic">
                    "{request.landlord_comment}"
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                    {request.tenant.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <span className="text-xs font-bold text-gray-700">{request.tenant.full_name}</span>
                </div>

                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-[11px] font-bold shadow-xs transition-colors",
                  status.color
                )}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {status.label}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
      
      <ReplyDialog 
        request={replyRequest} 
        open={!!replyRequest} 
        onClose={() => setReplyRequest(null)}
        onSuccess={onUpdate}
      />
    </div>
  )
}

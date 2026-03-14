"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  MoreVertical,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Image as ImageIcon,
  Send,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "rejected";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  unit: {
    name: string;
    property: {
      name: string;
    };
  };
  tenant: {
    full_name: string;
  };
  landlord_comment?: string;
}

interface MaintenanceListProps {
  requests: MaintenanceRequest[];
  loading: boolean;
  onUpdate: () => void;
  role?: "landlord" | "tenant";
}

const statusConfig = {
  open: {
    label: "Open",
    icon: AlertCircle,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle2,
    color: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    color: "bg-red-500/10 text-red-500 border-red-500/20",
  },
};

interface MaintenanceCenterProps {
  request: MaintenanceRequest | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function MaintenanceCenter({
  request,
  open,
  onClose,
  onSuccess,
}: MaintenanceCenterProps) {
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<any>("open");
  const [loading, setLoading] = useState(false);

  // Update local state when request changes
  useEffect(() => {
    if (request) {
      setComment(request.landlord_comment || "");
      setStatus(request.status);
    }
  }, [request]);

  const handleSubmit = async () => {
    if (!request) return;
    try {
      setLoading(true);
      await axios.patch(`/api/maintenance/${request.id}`, {
        status,
        landlord_comment: comment,
      });
      toast.success("Maintenance request updated");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to update request:", err);
      toast.error("Failed to update request");
    } finally {
      setLoading(false);
    }
  };

  if (!request) return null;

  const pCfg = priorityConfig[request.priority];
  const sCfg = statusConfig[request.status];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-[32px] border-border shadow-2xl sm:max-w-[600px] bg-card p-0 overflow-hidden">
        <div className="h-2 w-full bg-linear-to-r from-blue-500 via-indigo-500 to-violet-500" />

        <div className="p-8 space-y-8">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-3 mb-4">
              <Badge
                className={cn(
                  "text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border-0 shadow-sm",
                  pCfg.color,
                )}
              >
                {pCfg.label} PRIORITY
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">
                Submitted {format(new Date(request.created_at), "PPP")}
              </span>
            </div>
            <DialogTitle className="text-2xl font-black text-foreground max-w-[90%] tracking-tight leading-tight">
              {request.title}
            </DialogTitle>
            <DialogDescription className="text-blue-500 font-bold flex items-center gap-2 mt-2">
              {request.unit.property.name}{" "}
              <span className="w-1 h-1 rounded-full bg-border" /> Unit{" "}
              {request.unit.name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Requester
                </p>
                <div className="flex items-center gap-2 bg-muted/30 p-2.5 rounded-2xl border border-border/50">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                    {request.tenant.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {request.tenant.full_name}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Update Progress
              </p>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger className="h-12 rounded-2xl border-border bg-muted/30 font-bold">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border">
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Issue Description
              </p>
              <div className="bg-muted/20 p-5 rounded-3xl border border-border/40 leading-relaxed text-sm text-foreground/80">
                {request.description}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                Action & Comments
              </p>
              <Textarea
                placeholder="Updates, instructions, or resolution notes..."
                className="min-h-[140px] rounded-[24px] border-border bg-muted/40 p-5 focus:ring-blue-500 placeholder:text-muted-foreground/40 text-sm leading-relaxed"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={onClose}
              className="rounded-2xl h-14 font-bold text-muted-foreground hover:text-foreground px-6"
            >
              Close
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-2xl h-14 bg-foreground text-background hover:bg-foreground/90 font-black px-10 gap-2 shadow-xl shadow-foreground/10"
            >
              {loading ? (
                <Clock className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const priorityConfig = {
  low: { label: "Low", color: "bg-muted text-muted-foreground border-border" },
  medium: {
    label: "Medium",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  high: {
    label: "High",
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
  urgent: {
    label: "Urgent",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
  },
};

export function MaintenanceList({
  requests,
  loading,
  onUpdate,
  role,
}: MaintenanceListProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [replyRequest, setReplyRequest] = useState<MaintenanceRequest | null>(
    null,
  );

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setUpdating(id);
      await axios.patch(`/api/maintenance/${id}`, { status });
      toast.success(`Request status updated to ${status}`);
      onUpdate();
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card
            key={i}
            className="rounded-2xl border-border bg-card shadow-sm overflow-hidden text-card-foreground"
          >
            <CardHeader className="pb-3 border-b border-border">
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
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="rounded-3xl border-dashed border-2 border-border bg-muted/30">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-card shadow-xl flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground mb-2">
            No Maintenance Requests
          </CardTitle>
          <CardDescription className="text-muted-foreground max-w-xs">
            {role === "landlord"
              ? "Your properties are in good shape! No issues reported."
              : "Everything looks good? You can report any maintenance issues here."}
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {requests.map((request) => {
        const status = statusConfig[request.status];
        const priority = priorityConfig[request.priority];
        const StatusIcon = status.icon;

        return (
          <Card
            key={request.id}
            onClick={() => setReplyRequest(request)}
            className={cn(
              "rounded-[32px] border-border shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden bg-card cursor-pointer",
              updating === request.id && "opacity-50 pointer-events-none",
            )}
          >
            <div
              className={cn("h-1.5 w-full", {
                "bg-blue-500": request.status === "open",
                "bg-amber-500": request.status === "in_progress",
                "bg-green-500": request.status === "resolved",
                "bg-red-500": request.status === "rejected",
              })}
            />

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-[10px] uppercase tracking-wider font-bold h-5 px-2 rounded-full border-0",
                        priority.color,
                      )}
                    >
                      {priority.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                      {format(new Date(request.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground group-hover:text-blue-500 transition-colors">
                    {request.title}
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <span className="text-blue-500">
                      {request.unit.property.name}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>Unit {request.unit.name}</span>
                  </CardDescription>
                </div>

                {role === "landlord" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full -mr-2 hover:bg-muted"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="rounded-2xl border-border bg-card shadow-2xl p-2 w-48"
                    >
                      <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 pb-2 font-black">
                        Actions
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(request.id, "in_progress");
                        }}
                        className="rounded-xl py-2.5 cursor-pointer focus:bg-amber-500/10 focus:text-amber-500 gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        <span className="font-bold">In Progress</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(request.id, "resolved");
                        }}
                        className="rounded-xl py-2.5 cursor-pointer focus:bg-emerald-500/10 focus:text-emerald-500 gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-bold">Resolved</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(request.id, "rejected");
                        }}
                        className="rounded-xl py-2.5 cursor-pointer focus:bg-red-500/10 focus:text-red-500 gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span className="font-bold">Reject</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border/50 my-1" />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplyRequest(request);
                        }}
                        className="rounded-xl py-2.5 cursor-pointer focus:bg-blue-500/10 focus:text-blue-500 gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="font-bold">View & Reply</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed bg-muted/30 p-4 rounded-2xl">
                {request.description}
              </p>

              {request.landlord_comment && (
                <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl space-y-2">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                    Landlord's Response
                  </p>
                  <p className="text-sm text-foreground leading-relaxed italic">
                    "{request.landlord_comment}"
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                    {request.tenant.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">
                    {request.tenant.full_name}
                  </span>
                </div>

                <div
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-[11px] font-bold shadow-xs transition-colors",
                    status.color,
                  )}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  {status.label}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <MaintenanceCenter
        request={replyRequest}
        open={!!replyRequest}
        onClose={() => setReplyRequest(null)}
        onSuccess={onUpdate}
      />
    </div>
  );
}

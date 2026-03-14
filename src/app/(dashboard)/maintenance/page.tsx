"use client"

import { useState, useEffect } from "react"
import { TopBar } from "@/components/dashboard/top-bar"
import { useUser } from "@/hooks/use-user"
import { MaintenanceList } from "@/components/maintenance/maintenance-list"
import { RequestForm } from "@/components/maintenance/request-form"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"

export default function MaintenancePage() {
  const { user } = useUser()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get("/api/maintenance")
      setRequests(data.requests)
    } catch (err) {
      console.error("Failed to fetch maintenance requests:", err)
      toast.error("Failed to load maintenance requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const topBarUser = {
    name: user?.full_name || "User",
    email: user?.email || "",
    role: user?.role || "tenant",
  }

  return (
    <>
      <TopBar title="Maintenance" user={topBarUser} notificationCount={0} />
      <div className="p-6 lg:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Maintenance Requests</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.role === "landlord"
                ? "Track and manage property maintenance issues."
                : "Report issues and stay updated on repairs."}
            </p>
          </div>
          {user?.role === "tenant" && (
            <Button onClick={() => setIsFormOpen(true)} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          )}
        </div>

        <MaintenanceList 
          requests={requests} 
          loading={loading} 
          onUpdate={fetchRequests} 
          role={user?.role}
        />

        {user?.role === "tenant" && (
          <RequestForm 
            open={isFormOpen} 
            onOpenChange={setIsFormOpen} 
            onSuccess={fetchRequests} 
          />
        )}
      </div>
    </>
  )
}

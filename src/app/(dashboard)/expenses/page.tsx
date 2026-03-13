"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { 
  Plus, 
  Search, 
  Receipt, 
  RefreshCw, 
  Filter, 
  TrendingDown,
  Calendar,
  Building,
  Tag
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { TopBar } from "@/components/dashboard/top-bar"
import { PageHeader } from "@/components/dashboard/page-header"
import { formatCurrency } from "@/lib/utils/format"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useSessionUser } from "@/components/auth/auth-context"
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
import { Textarea } from "@/components/ui/textarea"

interface Expense {
  id: string
  amount: number
  category: string
  description: string
  date: string
  property_id: string | null
  property?: {
    name: string
  }
}

interface Property {
  id: string
  name: string
}

const CATEGORIES = [
  "Maintenance",
  "Utilities",
  "Taxes",
  "Insurance",
  "Management Fees",
  "Marketing",
  "Legal",
  "Repairs",
  "Other"
]

function AddExpenseDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: { 
  open: boolean, 
  onOpenChange: (v: boolean) => void, 
  onSuccess: () => void 
}) {
  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    property_id: "none"
  })

  useEffect(() => {
    if (open) {
      axios.get("/api/properties").then(res => setProperties(res.data.properties || []))
    }
  }, [open])

  const handleSubmit = async () => {
    if (!formData.amount || !formData.category || !formData.date) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setLoading(true)
      await axios.post("/api/expenses", {
        ...formData,
        amount: parseFloat(formData.amount),
        property_id: formData.property_id === "none" ? null : formData.property_id
      })
      toast.success("Expense added successfully")
      onSuccess()
      onOpenChange(false)
      setFormData({
        amount: "",
        category: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        property_id: "none"
      })
    } catch (err) {
      console.error("Failed to add expense:", err)
      toast.error("Failed to add expense")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-[500px] border-gray-100 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">Add Expense</DialogTitle>
          <DialogDescription className="text-sm">
            Track maintenance, taxes, or any other property costs.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Amount (₦)</label>
              <Input 
                type="number"
                placeholder="0.00"
                className="h-12 rounded-2xl border-gray-100 bg-gray-50/50"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date</label>
              <Input 
                type="date"
                className="h-12 rounded-2xl border-gray-100 bg-gray-50/50"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</label>
            <Select 
              value={formData.category} 
              onValueChange={(v) => setFormData({...formData, category: v})}
            >
              <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-gray-100">
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Property (Optional)</label>
            <Select 
              value={formData.property_id} 
              onValueChange={(v) => setFormData({...formData, property_id: v})}
            >
              <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50">
                <SelectValue placeholder="General expense" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-gray-100">
                <SelectItem value="none">General Expense</SelectItem>
                {properties.map(prop => (
                  <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</label>
            <Textarea 
              placeholder="What was this expense for?"
              className="min-h-[100px] rounded-2xl border-gray-100 bg-gray-50/50 p-4"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="ghost" className="rounded-xl h-12" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            className="rounded-xl h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 gap-2"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingDown className="w-4 h-4" />}
            Save Expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ExpensesPage() {
  const user = useSessionUser()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await axios.get("/api/expenses")
      setExpenses(data.expenses || [])
    } catch (err) {
      toast.error("Failed to load expenses")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const filtered = expenses.filter(e => 
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    e.description?.toLowerCase().includes(search.toLowerCase()) ||
    e.property?.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalExpenses = filtered.reduce((sum, e) => sum + e.amount, 0)

  return (
    <>
      <TopBar title="Expenses" user={user} />
      <div className="px-4 py-4 lg:px-8 lg:py-8 max-w-[1200px] mx-auto w-full space-y-8">
        <PageHeader 
          title="Expenses" 
          subtitle="Track and manage your property costs"
          user={user}
          action={
            <Button 
              onClick={() => setDialogOpen(true)}
              className="h-11 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-lg shadow-blue-100 hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-[32px] border-gray-100 shadow-sm bg-linear-to-br from-white to-gray-50/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Expenses</CardDescription>
              <CardTitle className="text-3xl font-black tracking-tight text-red-600">
                {formatCurrency(totalExpenses)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                <span>Across {filtered.length} entries</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search expenses..." 
              className="pl-11 h-12 rounded-2xl border-gray-100 bg-white focus:ring-blue-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 w-12 rounded-2xl border-gray-100 bg-white">
            <Filter className="w-4 h-4 text-gray-400" />
          </Button>
          <Button 
            variant="outline" 
            className="h-12 w-12 rounded-2xl border-gray-100 bg-white"
            onClick={fetchExpenses}
          >
            <RefreshCw className={cn("w-4 h-4 text-gray-400", loading && "animate-spin")} />
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[180px] rounded-3xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center">
              <Receipt className="w-10 h-10 text-gray-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">No expenses found</h3>
              <p className="text-sm text-gray-500 max-w-xs">Start tracking your business costs by adding your first expense.</p>
            </div>
            <Button 
              onClick={() => setDialogOpen(true)}
              variant="outline" 
              className="rounded-xl"
            >
              Add Your First Expense
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((expense) => (
              <Card key={expense.id} className="rounded-[32px] border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group bg-white overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider">
                          <Tag className="w-3 h-3" />
                          {expense.category}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(expense.date), "MMM d, yyyy")}
                        </span>
                      </div>
                      <CardTitle className="text-xl font-black text-gray-900 leading-tight">
                        {formatCurrency(expense.amount)}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] leading-relaxed">
                    {expense.description || "No description provided."}
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                    <Building className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider truncate">
                      {expense.property?.name || "General Business"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AddExpenseDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={fetchExpenses}
      />
    </>
  )
}

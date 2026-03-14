"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Loader2, UserPlus, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Property {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  name: string;
  propertyName: string;
}

interface AddTenantDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
  preSelectedPropertyId?: string;
  preSelectedUnitId?: string;
}

export function AddTenantDialog({
  open,
  onOpenChange,
  onSuccess,
  preSelectedPropertyId,
  preSelectedUnitId,
}: AddTenantDialogProps) {
  const [phone, setPhone] = useState("");
  const [propertyId, setPropertyId] = useState(preSelectedPropertyId || "");
  const [unitId, setUnitId] = useState(preSelectedUnitId || "");
  const [startDate, setStartDate] = useState("");
  const [rentCycle, setRentCycle] = useState<"monthly" | "annual">("annual");
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [fetchingUnits, setFetchingUnits] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    phone?: string;
    propertyId?: string;
    unitId?: string;
  }>({});
  const [phoneValidated, setPhoneValidated] = useState<
    "idle" | "valid" | "invalid"
  >("idle");

  useEffect(() => {
    if (!open) return;
    axios
      .get("/api/properties?limit=100")
      .then((r) => setProperties(r.data.properties ?? []))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!propertyId) {
      setUnits([]);
      return;
    }
    setFetchingUnits(true);
    axios
      .get(`/api/properties/${propertyId}/units`)
      .then((r) => {
        const vacant = (r.data.units ?? []).filter(
          (u: Unit & { isVacant: boolean }) => u.isVacant,
        );
        setUnits(vacant);
      })
      .catch(() => {})
      .finally(() => setFetchingUnits(false));
  }, [propertyId]);

  useEffect(() => {
    if (preSelectedPropertyId) setPropertyId(preSelectedPropertyId);
    if (preSelectedUnitId) setUnitId(preSelectedUnitId);
  }, [preSelectedPropertyId, preSelectedUnitId]);

  async function validatePhone() {
    if (!phone.trim()) return;
    setValidating(true);
    setError(null);
    try {
      const res = await axios.get(
        `/api/tenants/validate?phone=${encodeURIComponent(phone.trim())}`,
      );
      setPhoneValidated(res.data.valid ? "valid" : "invalid");
      if (res.data.error) {
        setError(res.data.error);
      }
    } catch (err: any) {
      setPhoneValidated("idle");
      setError(err.response?.data?.error ?? "Could not validate phone number.");
    } finally {
      setValidating(false);
    }
  }

  function reset() {
    setPhone("");
    setPropertyId("");
    setUnitId("");
    setStartDate("");
    setRentCycle("annual");
    setError(null);
    setSuccess(null);
    setErrors({});
    setPhoneValidated("idle");
  }

  const canSubmit =
    phoneValidated === "valid" && propertyId && unitId && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!phone.trim()) newErrors.phone = "Tenant phone is required.";
    if (!propertyId) newErrors.propertyId = "Please select a property.";
    if (!unitId) newErrors.unitId = "Please select a unit.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.post("/api/tenants", {
        phone: phone.trim(),
        unitId,
        startDate: startDate || new Date().toISOString(),
        rentCycle,
      });
      setSuccess("Invitation sent successfully!");
      setTimeout(() => {
        reset();
        onSuccess();
        onOpenChange(false);
      }, 1500);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.response?.data?.needsRegistration) {
        setPhoneValidated("invalid");
        setError("This user hasn't registered on RentLedger yet.");
      } else {
        setError(err.response?.data?.error ?? "Failed to send invitation.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!loading) {
          reset();
          onOpenChange(v);
        }
      }}
    >
      <DialogContent className="w-[95vw] sm:max-w-112.5 max-h-[85vh] sm:max-h-[90vh] flex flex-col rounded-3xl p-0 border border-border bg-card shadow-2xl">
        <div className="shrink-0 bg-linear-to-br from-green-500/10 to-transparent px-4 sm:px-6 pt-6 pb-5 border-b border-border/50">
          <DialogHeader>
            <div className="w-11 h-11 bg-green-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/20">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-xl font-black tracking-[-0.025em] text-foreground">
              Invite Tenant
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Invite a tenant by their phone number. They must have an account on RentLedger first.
            </DialogDescription>
          </DialogHeader>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 pt-4 space-y-4"
        >
          {error && (
            <Alert
              variant="destructive"
              className="border-red-500/20 bg-red-500/10 rounded-[10px] py-3"
            >
              <AlertDescription className="text-xs text-red-500">{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-green-500/20 bg-green-500/10 rounded-[10px] py-3">
              <AlertDescription className="text-xs text-green-500">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {!preSelectedPropertyId && (
              <div className="flex-1 space-y-1.5 w-full">
                <Label className="text-sm font-semibold text-foreground/80">
                  Property <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={propertyId}
                  onValueChange={(v) => {
                    setPropertyId(v);
                    setUnitId("");
                    setErrors((p) => ({ ...p, propertyId: undefined }));
                  }}
                >
                  <SelectTrigger
                    className={`h-11 w-full rounded-xl text-sm bg-muted/30 ${errors.propertyId ? "border-red-500/50" : "border-border"}`}
                  >
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[10px]">
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.propertyId && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.propertyId}
                  </p>
                )}
              </div>
            )}

            <div
              className={`${preSelectedPropertyId ? "w-full" : "flex-1"} space-y-1.5`}
            >
              <Label className="text-sm font-semibold text-foreground/80">
                Unit <span className="text-red-500">*</span>
              </Label>
              <Select
                value={unitId}
                onValueChange={(v) => {
                  setUnitId(v);
                  setErrors((p) => ({ ...p, unitId: undefined }));
                }}
              >
                <SelectTrigger
                  className={`h-11 w-full rounded-xl text-sm bg-muted/30 ${errors.unitId ? "border-red-500/50" : "border-border"}`}
                  disabled={!propertyId || fetchingUnits}
                >
                  <SelectValue
                    placeholder={
                      fetchingUnits ? "Loading..." : "Select a vacant unit"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="rounded-[10px]">
                  {units.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No vacant units
                    </div>
                  ) : (
                    units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        Unit {u.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.unitId && (
                <p className="text-xs text-red-500 font-medium">
                  {errors.unitId}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground/80">
              Tenant Phone <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 min-w-0">
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneValidated("idle");
                    setErrors((p) => ({ ...p, phone: undefined }));
                  }}
                  placeholder="e.g. 08012345678"
                  disabled={loading}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), validatePhone())
                  }
                  className={`h-11 rounded-xl text-sm pr-10 bg-muted/30 ${errors.phone ? "border-red-500/50 bg-red-500/5" : phoneValidated === "valid" ? "border-green-500/50 bg-green-500/5" : phoneValidated === "invalid" ? "border-red-500/50 bg-red-500/5" : "border-border focus-visible:border-green-500/50 placeholder:text-muted-foreground/50"}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {phoneValidated === "valid" && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                  {phoneValidated === "invalid" && (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              <Button
                type="button"
                onClick={validatePhone}
                disabled={!phone.trim() || validating || loading}
                className="cursor-pointer h-11 rounded-xl border-border bg-muted/20 px-4 text-sm font-medium whitespace-nowrap sm:w-auto w-full hover:bg-muted/40 text-foreground"
              >
                {validating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Check"
                )}
              </Button>
            </div>
            {phoneValidated === "valid" && (
              <p className="text-xs text-green-600 font-medium">User found</p>
            )}
            {phoneValidated === "invalid" && (
              <p className="text-xs text-red-500 font-medium">
                User not found. They need to register first. You can share the registration link with them.
              </p>
            )}
            {errors.phone && (
              <p className="text-xs text-red-500 font-medium">{errors.phone}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground/80">
                Rent Cycle
              </Label>
              <Select
                value={rentCycle}
                onValueChange={(v) => setRentCycle(v as "monthly" | "annual")}
              >
                <SelectTrigger className="h-11 w-full rounded-xl text-sm border-border bg-muted/30">
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent className="rounded-[10px]">
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground/80">
                Start Date{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
                className="h-11 rounded-xl text-sm border-border bg-muted/30 focus-visible:border-green-500/50 focus-visible:ring-1 focus-visible:ring-green-500/50"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={loading}
              className="flex-1 h-11 rounded-xl border-border bg-muted/20 font-semibold text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 h-11 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold gap-2 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:-translate-y-px transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invite"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

-- PERFORMANCE UPGRADE 1: Database Indexing (UPDATED)

-- Properties: Fast lookup by landlord
CREATE INDEX IF NOT EXISTS idx_properties_landlord_id ON public.properties(landlord_id);

-- Units: Fast lookup by property
CREATE INDEX IF NOT EXISTS idx_units_property_id ON public.units(property_id);

-- Tenancies: Fast lookup by tenant, unit, or status
CREATE INDEX IF NOT EXISTS idx_tenancies_tenant_id ON public.tenancies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenancies_unit_id ON public.tenancies(unit_id);
-- Now using the corrected 'status' column
CREATE INDEX IF NOT EXISTS idx_tenancies_status ON public.tenancies(status) WHERE status = 'active';

-- Payments: Fast lookup by tenancy and status
CREATE INDEX IF NOT EXISTS idx_payments_tenancy_id ON public.payments(tenancy_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date DESC);

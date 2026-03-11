# 🚀 RentLedger: Performance & Features Upgrade Plan

This document details the recommended upgrades to improve the performance, scalability, and value of the RentLedger platform.

---

## ⚡ Performance Optimizations

### 1. Database Indexing [COMPLETED] ✅
Speed up queries as data scales by adding indices to frequently filtered columns.
- **Implemented**: Indices added to `tenancies`, `payments`, `units`, and `properties`.

### 2. Server-Side Aggregations (Views) [COMPLETED] ✅
Offload dashboard calculations from the client/service layer to PostgreSQL.
- **Implemented**: Created `landlord_dashboard_stats` and `tenant_dashboard_stats` views.
- **Efficiency**: Reduced dashboard database calls and offloaded complex overdue logic to the DB engine.

### 3. Smart Pagination
Prevent UI lag by implementing cursor-based pagination for:
- Property and unit lists.
- Detailed payment history tables.

### 4. Optimized Re-renders
Audit dashboard components to ensure the React Compiler (Next.js 15 feature) is effectively memoizing expensive UI chunks.

---

## ✨ New Value-Add Features

### 1. 🛠 Maintenance Request System
- **Tenant side**: Upload photos and description of issues.
- **Landlord side**: Track status (Open → In Progress → Resolved).
- **Notifications**: Alert landlords when new tickets are raised.

### 2. 💸 Landlord Expense Tracking
- Track maintenance costs, taxes, and utility payments.
- **Profitability Dashboard**: View Net Income (Revenue - Expenses).

### 3. 📅 Automated Rent Generation
- Move from manual generation to an automated system.
- Use Supabase Edge Functions to create `pending` payment records on the 1st of every month (or cycle).

### 4. 🔗 Payment Gateway Integration
- Integrate **Paystack** or **Stripe**.
- Automated verification: Status updates to `verified` instantly via webhooks upon successful payment.

### 5. 🔔 Advanced Notification Center
- Web Push notifications for rent due reminders.
- Real-time "Payment Received" toasts for landlords.

---

## 🎨 Professional UI Enhancements

- **Dynamic Charts**: Add visual trends for monthly revenue and expense growth.
- **Dark Mode**: A sleek, premium dark theme for power users.
- **Onboarding Flow**: Guided tour for new landlords to set up their first property.

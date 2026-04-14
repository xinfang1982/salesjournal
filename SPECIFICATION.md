# SalesJournal — Product Specification

## Overview

A web app for a salesperson who sources products from German vendors (Amazon, DM, Rossmann, etc.) on behalf of customers, quotes in EUR, and collects payment in RMB.

---

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: JavaScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

---

## Data Models

### Customer

| Field            | Type   |
|------------------|--------|
| id               | uuid   |
| name             | string |
| wechat_id        | string |
| phone_number     | string |
| shipping_address | text   |

### Order Item

Each order belongs to one customer and represents one product purchase.

| Field              | Type    | Notes                                      |
|--------------------|---------|--------------------------------------------|
| id                 | uuid    |                                            |
| customer_id        | uuid    | FK → Customer                              |
| brand              | string  |                                            |
| product_name       | string  |                                            |
| provider           | string  | e.g. Amazon, DM, Rossmann                  |
| price_per_qty_eur  | decimal | Selling price per unit (EUR)               |
| quantity           | integer |                                            |
| total_price_eur    | decimal | Auto: price_per_qty_eur × quantity         |
| cost_eur           | decimal | Purchase cost from vendor (EUR)            |
| cost_rmb           | decimal | Manually entered RMB equivalent of cost    |
| exchange_rate      | decimal | Negotiated EUR→RMB rate                    |
| amount_paid_rmb    | decimal | Auto: total_price_eur × exchange_rate      |
| margin_eur         | decimal | Auto: total_price_eur − cost_eur           |
| margin_rmb         | decimal | Auto: amount_paid_rmb − cost_rmb           |
| purchase_date      | date    | Defaults to current date on creation       |
| delivery_date      | date    | Defaults to current date on creation       |
| order_status       | enum    | Ordered / Goods Receipt / Goods Issue / Customer Confirms |
| payment_status     | enum    | Paid / Unpaid                              |
| notes              | text    |                                            |

### Additional Cost

Overhead costs (packaging supplies, etc.) not tied to a specific order.

| Field       | Type    | Notes                        |
|-------------|---------|------------------------------|
| id          | uuid    |                              |
| description | string  | e.g. 胶带, 泡泡膜, 气柱       |
| amount_rmb  | decimal | Cost in RMB                  |
| date        | date    |                              |

---

## Screens

### 1. Home Screen

Three navigation options:

1. **Summary Overview** — view all-time gain summary
2. **Create New Order** — create a new order for a customer
3. **Additional Costs** — log overhead/packaging costs

---

### 2. Summary Overview

A matrix table showing gains by month and year (2021 onwards).

**Columns**: Year (2021, 2022, 2023, ...)
**Rows**: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec, Total, Annualised Gain, %

**Calculations**:
- **Gross Gain (RMB)** per cell = sum of `margin_rmb` for all orders in that month/year
- **Additional Costs (RMB)** per year = sum of `amount_rmb` from Additional Costs table for that year
- **Net Gain (RMB)** per year = Gross Gain − Additional Costs
- **Total** row = sum of all months in the year
- **Annualised Gain** = extrapolated full-year figure for partial years; equals Total for complete years
- **%** row = year-over-year growth vs previous year's Total

The summary shows all three rows at the bottom: Gross Gain Total, Additional Costs, Net Gain.

---

### 3. Order List View

- Displays all orders in a table
- **Filter by customer** (dropdown)
- Every field is **inline editable** directly in the table
- Auto-calculated fields (total_price_eur, amount_paid_rmb, margin_eur, margin_rmb) update in real time as values are edited

---

### 4. Create New Order

A form to create a new order:

- Select or search existing customer (or create new inline)
- All date fields default to **current date**
- All required fields must be filled before saving
- Auto-calculated fields shown in real time

---

### 5. Customer Management Screen

- List all customers
- **Add** new customer
- **Edit** customer details inline or via form
- **Delete** customer (with confirmation)
- **View all orders** for a customer (links to Order List filtered by that customer)

---

### 6. Additional Costs Screen

- List all additional cost entries (description, amount RMB, date)
- **Add** new entry
- **Edit** existing entry
- **Delete** entry
- Totals shown per year

---

## Business Rules

1. `total_price_eur` = `price_per_qty_eur` × `quantity`
2. `amount_paid_rmb` = `total_price_eur` × `exchange_rate`
3. `margin_eur` = `total_price_eur` − `cost_eur`
4. `margin_rmb` = `amount_paid_rmb` − `cost_rmb`
5. All date fields default to the current date when creating a new order
6. The salesperson always quotes in EUR and receives payment in RMB
7. Exchange rate is manually entered per order (negotiated individually)
8. Additional costs are deducted from gross gain to arrive at net gain in the summary

---

## Future Considerations (Out of Scope for v1)

- Multi-user / authentication
- Export to Excel/CSV
- Currency exchange rate API integration
- Mobile app

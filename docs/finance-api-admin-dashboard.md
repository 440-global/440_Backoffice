# Finance API — Admin Dashboard (doc patches)

Use this file as **edits to apply** to your canonical **Finance API — Admin Dashboard** markdown (the long spec with §§1–14). It documents the **admin orders → manual transaction** linkage only.

---

## 1. Intro (after the opening “Use it to wire…” paragraph)

Add:

**Admin orders:** `GET /admin/orders` and `GET /admin/orders/:id` return **`supplierId`** on each order when the API attaches it (and may include **`supplierName`**). When creating **`POST /finance/manual-entries`** from an order picked in the admin orders UI, **send that `supplierId`** in the body (together with `checkoutId` / `oderId` as needed). See §11 *Linking rules*.

---

## 2. §11 `POST /finance/manual-entries` — *Linking rules*

Insert this bullet **after** the long **`checkoutId` / `orderId` (legacy)** bullet (the one that ends with “supplier from the first order line that has a product supplier”), and **before** the bullet that starts with “If `supplierId` is provided (or resolved from `baleId` / `orderId`)…”:

- **Admin orders:** **`GET /admin/orders`** and **`GET /admin/orders/:id`** include **`supplierId`** on each **order** when the API attaches it (and may include **`supplierName`** for display). When the finance UI creates **`POST /finance/manual-entries`** from a selected admin order, **send that `supplierId`** in the request body together with **`checkoutId`** / **`orderId`** as applicable. Prefer this explicit order-level **`supplierId`** over inferring supplier only from checkout → line item → product when both are available.

*(This complements existing rules: explicit `supplierId`, bale-derived supplier, checkout line-item supplier, etc.)*

---

## 3. §14 *Changelog (doc)*

Append:

- **Admin orders:** **`GET /admin/orders`** and **`GET /admin/orders/:id`** expose **`supplierId`** on each order when known; manual-entry UIs should **forward `supplierId` on `POST /finance/manual-entries`** so ledger linkage matches the order’s supplier without relying only on product-walk resolution.

---

## 4. Optional: admin orders field (reference)

If you document admin orders elsewhere in the same repo, each **order** in list and detail responses may include:

| Field | Type | Meaning |
|-------|------|--------|
| `supplierId` | integer (optional) | Supplier to use when linking finance actions (e.g. manual ledger) to that order |
| `supplierName` | string (optional) | Display label when present |

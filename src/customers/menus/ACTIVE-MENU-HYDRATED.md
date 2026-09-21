# Active customer menu (hydrated) — Flutter API

Documentation for the mobile-only endpoint that returns the customer’s **newest (active) menu** with ingredient rows expanded from the `ingredients` table.

| | |
|---|---|
| **Module** | `src/customers/menus/` (`CustomersMenusModule`) — separate from coach CRUD in `src/customer-menus/` |
| **Audience** | Flutter app (mobile user-number login token) |
| **Auth protocol** | Same as routines viewer (`GET /routines/client/:id_user`): **JWT only** (`JwtAuthGuard`). No `RolesGuard`. Tenancy checks are in the service. |

Swagger tag: **customers / menus** (`/api`).

### Paths (all equivalent for the logged-in customer)

| Method / path | Notes |
|---------------|--------|
| **`POST /customer-menus/sync`** | Preferred for Flutter — uses JWT `sub` as the customer id (no path param) |
| `POST /customer-menus/active/:id_user` | Explicit id (must be self when role is `customer`) |
| `POST /customer-menus/client/:id_user` | Alias mirroring routines naming |

> **Breaking change:** the preferred path used to be bare `POST /customer-menus`. That path is now **staff web create** (`{ id_user, data }`). See [`MOBILE-MENU-SYNC-MIGRATION.md`](./MOBILE-MENU-SYNC-MIGRATION.md).

Body carries the client cache stamp (`created_at` + `updated_at`). Same idea as `POST /customers/sync-routine`.

Staff web list is **`GET /customer-menus/by-user?id_user=`** (owner/coach/solo_coach only).
Staff web create is **`POST /customer-menus`** with `{ id_user, data }` (owner/coach/solo_coach only).

---

## 1. How to get a token

Mobile login does **not** require a password. It accepts email or numeric `user_number`.

```http
POST /customers/login
Content-Type: application/json

{
  "identifier": "48291"
}
```

Successful response (shape):

```json
{
  "accessToken": "<JWT>",
  "customer": {
    "name": "…",
    "userNumber": "48291",
    "email": "a***@…",
    "routineData": null
  }
}
```

Use `accessToken` as:

```http
Authorization: Bearer <accessToken>
```

The JWT payload includes at least:

| Claim | Meaning |
|--------|---------|
| `sub` | Numeric `id_user` |
| `role` | `customer` for mobile login |
| `id_account` | Tenant account (server-side scoping) |

---

## 2. How to call the endpoint

### Request JSON (body)

```json
{
  "created_at": "2026-08-01T12:00:00.000Z",
  "updated_at": "2026-08-06T15:30:00.000Z"
}
```

| Field | Type | Rules |
|-------|------|--------|
| `created_at` | ISO 8601 string \| null | From last successful menu payload. Omit/`null` on first sync. |
| `updated_at` | ISO 8601 string \| null | Last update from last payload (`updated_at`). Omit/`null` on first sync. |

**First sync** (no cache yet):

```json
{
  "created_at": null,
  "updated_at": null
}
```

### Preferred (Flutter)

```http
POST /customer-menus/sync
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "created_at": "2026-08-01T12:00:00.000Z",
  "updated_at": "2026-08-06T15:30:00.000Z"
}
```

### Responses

**Up to date** (client stamps match newest menu) → `200`:

```json
{
  "isUpToDate": true
}
```

**Stale / first fetch** → `200` with full hydrated menu:

```json
{
  "isUpToDate": false,
  "created_at": "2026-08-07T18:00:00.000Z",
  "updated_at": "2026-08-07T19:30:00.000Z",
  "data": { "planType": "estricto", "days": { }, "tags": { } }
}
```

Persist `created_at` + `updated_at` locally and send them on the next sync.

### With explicit user id

```http
POST /customer-menus/client/{id_user}
Authorization: Bearer <accessToken>
Content-Type: application/json
```

| Name | Type | Rules |
|------|------|--------|
| `id_user` | integer | Target customer in the JWT account. If JWT role is `customer`, must equal JWT `sub`. |

### cURL

```bash
TOKEN="eyJ…"

curl -sS -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"created_at":null,"updated_at":null}' \
  "https://<api-host>/customer-menus/sync"
```

### Flutter (sketch)

```dart
final response = await dio.post(
  '/customer-menus/sync',
  data: {
    'created_at': cachedCreatedAt, // null on first sync
    'updated_at': cachedUpdatedAt,
  },
  options: Options(
    headers: {'Authorization': 'Bearer $accessToken'},
  ),
);
if (response.data['isUpToDate'] == true) {
  // keep local cache
} else {
  final createdAt = response.data['created_at'];
  final updatedAt = response.data['updated_at'];
  final data = response.data['data'] as Map<String, dynamic>;
  // persist createdAt + updatedAt for next sync
}
```

---

## 3. Success response

HTTP **200**.

Up to date:

```json
{ "isUpToDate": true }
```

New / changed menu:

```json
{
  "isUpToDate": false,
  "created_at": "2026-08-04T18:00:00.000Z",
  "updated_at": "2026-08-04T20:15:00.000Z",
  "data": { }
}
```

| Field | Description |
|--------|-------------|
| `created_at` | Menu row creation time (`customer_menus.created_at`) |
| `updated_at` | Last menu update (`customer_menus.updated_at`) |
| `data` | Persisted plan JSON with every `kind: "ingredient"` **flat-merged** from DB |

There is **no** `id_menu`, `id_user`, or `status` in this response.

---

## 4. How it works (server flow)

```text
Flutter JWT (from POST /customers/login — user number)
        │
        ▼
1) JwtAuthGuard only (same as GET /routines/client/:id_user)
2) Target customer must belong to JWT id_account, role=customer, status=active
   (same assert pattern as RoutinesService.assertCustomerBelongsToAccount)
3) If JWT role is customer → may only read own menu (sub === id_user)
4) Load newest customer_menus row for that user
   WHERE status != deleted
   ORDER BY created_at DESC
   LIMIT 1
5) Walk data JSON → collect unique ingredient ids
   (kind === "ingredient" anywhere, including inside recipes)
6) Single Prisma query: ingredients WHERE id_ingredient IN (…)
7) Deep-clone data and replace each ingredient object with flat merge
8) Return { created_at, updated_at, data }
```

### What “active” means

- Not soft-deleted (`status ≠ deleted`).
- Among those rows, the **most recently created** menu (`created_at` DESC).
- Same idea as the web “Active” tag on the newest menu card.

### Ingredient hydration

**Stored** (slim, as written by the web Save/Update):

```json
{ "id": "12", "quantity": 100, "kind": "ingredient" }
```

**Returned** (flat merge — macros already scaled to `quantity`):

```json
{
  "kind": "ingredient",
  "quantity": 100,
  "id_ingredient": 12,
  "name_es": "Pechuga de pollo",
  "name_en": "Chicken breast",
  "emoji": "🍗",
  "fat": 3,
  "protein": 31,
  "carbs": 0,
  "kcal": 165,
  "weight_per_unit": null
}
```

Formula (same as web menus): `(catalog_per_100g * quantity) / 100`, then `Math.round` (creator chips).
`fat` / `protein` / `carbs` / `kcal` are **for the assigned quantity**, not per 100g.
Flutter should treat these as the source of truth and not re-scale.

**Tags** are recomputed after hydration — see [`MENU-TAGS.md`](./MENU-TAGS.md).

Locations scanned:

1. Direct items on a platter / dynamic option: `…platters[].items[]` or `…options[].items[]`
2. Nested under a recipe: `…items[].ingredients[]` where the parent has `kind: "recipe"`

**Recipes** (`kind: "recipe"`) are **not** loaded from the `recipes` table; their shell (`id`, `name`, `imageUrl`, `macros`, nested ingredient list) stays as stored, except nested ingredients are hydrated. Recipe `macros` always include integer `fats`, `protein`, `carbs`, and **`kcal`** (portion sum).

### Missing ingredient IDs

If an id is not found in `ingredients`, the API still returns a row with `quantity` preserved and nutrition/name fields set to `null`:

```json
{
  "kind": "ingredient",
  "quantity": 100,
  "id_ingredient": 999,
  "name_es": null,
  "name_en": null,
  "emoji": null,
  "fat": null,
  "protein": null,
  "carbs": null,
  "kcal": null,
  "weight_per_unit": null
}
```

---

## 5. `data` shapes (after hydration)

### Estricto (`planType: "estricto"`)

```json
{
  "planType": "estricto",
  "days": {
    "mon": { "platters": [] },
    "tue": { "platters": [] },
    "wed": { "platters": [] },
    "thu": { "platters": [] },
    "fri": {
      "platters": [
        {
          "color": "blue",
          "name": null,
          "note": "Prep the night before",
          "timeWindow": { "from": "07:00", "to": "09:00" },
          "items": [
            {
              "kind": "ingredient",
              "quantity": 100,
              "id_ingredient": 12,
              "name_es": "…",
              "name_en": "…",
              "emoji": "…",
              "fat": 3,
              "protein": 31,
              "carbs": 0,
              "kcal": 165,
              "weight_per_unit": null
            },
            {
              "id": "5",
              "kind": "recipe",
              "name": "posho",
              "imageUrl": "https://…",
              "macros": { "fats": 8, "carbs": 46, "protein": 53, "kcal": 468 },
              "ingredients": [
                {
                  "kind": "ingredient",
                  "quantity": 80,
                  "id_ingredient": 12,
                  "name_es": "…",
                  "name_en": "…",
                  "emoji": "…",
                  "fat": 2,
                  "protein": 25,
                  "carbs": 0,
                  "kcal": 132,
                  "weight_per_unit": null
                }
              ]
            }
          ]
        }
      ]
    },
    "sat": { "platters": [] },
    "sun": { "platters": [] }
  },
  "tags": {
    "fri": {
      "fats": 11,
      "protein": 84,
      "carbs": 46,
      "kcal": 350,
      "foods": 1,
      "ingredients": 1
    }
  }
}
```

Weekday keys: `mon` | `tue` | `wed` | `thu` | `fri` | `sat` | `sun`.  
Root `tags[day]` = **total for that day** (see [`MENU-TAGS.md`](./MENU-TAGS.md)).  
Platter/option `name`: `null` = i18n default by plan type (see [`MENU-PLATTER-NAMES.md`](./MENU-PLATTER-NAMES.md)).

### Dinámico (`planType: "dinamico"`)

```json
{
  "planType": "dinamico",
  "groups": [
    {
      "name": "Platter/snack 1",
      "tags": {
        "fats": 0,
        "protein": 0,
        "carbs": 10,
        "kcal": 40,
        "foods": 0,
        "ingredients": 1
      },
      "timeWindow": { "from": "07:00", "to": "09:00" },
      "options": [
        {
          "color": "green",
          "name": null,
          "note": null,
          "items": [
            {
              "kind": "ingredient",
              "quantity": 50,
              "id_ingredient": 3,
              "name_es": "…",
              "name_en": "…",
              "emoji": "…",
              "fat": 0,
              "protein": 0,
              "carbs": 10,
              "kcal": 40,
              "weight_per_unit": null
            }
          ]
        }
      ]
    }
  ]
}
```

No root `tags`. Each `groups[i].tags` = **average per option** in that platter.  
Same ingredient flat-merge rules as estricto.

---

## 6. Error responses

Errors use uppercase translation keys (not human-readable sentences) in the Nest exception `message`.

| HTTP | Key | When |
|------|-----|------|
| **401** | (auth guard) | Missing/invalid/expired Bearer token |
| **403** | `CUSTOMERS.ERRORS.MENU_ACCESS_DENIED` | Target not an active customer in the account, or customer JWT reading another user |
| **404** | `CUSTOMERS.ERRORS.MENU_NOT_FOUND` | Customer has no non-deleted menu |
| **400** | (ParseIntPipe) | `id_user` is not an integer |

FE dictionaries (web) include EN/ES strings for those `CUSTOMERS.ERRORS.*` keys; Flutter should map keys the same way.

---

## 7. Relation to other menu APIs

| API | Module | Who | Purpose |
|-----|--------|-----|---------|
| `GET /customer-menus/by-user?id_user=` + POST/PATCH/DELETE… | `src/customer-menus/` | owner / coach / solo_coach | Web CRUD, raw `data` |
| **`POST /customer-menus/sync`** (and `/active/:id_user`, `/client/:id_user`) | **`src/customers/menus/`** | **Flutter JWT** | Active menu sync + ingredient hydration |

Use the mobile login token on the Flutter paths above — not the staff `by-user` list.

---

## 8. Source map

| Concern | File |
|---------|------|
| Route + guards | `customers-menus.controller.ts` |
| Business logic | `customers-menus.service.ts` |
| Collect ingredient ids | `utils/collect-menu-ingredient-ids.util.ts` |
| Flat-merge hydration | `utils/hydrate-menu-ingredients.util.ts` |
| Tag recompute (estricto/dinamico) | `utils/attach-menu-tags.util.ts` |
| Tag positions (mini-doc) | `MENU-TAGS.md` |
| Response DTO | `dto/active-customer-menu-response.dto.ts` |
| Module registration | `customers-menus.module.ts` → `app.module.ts` |

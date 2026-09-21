# Mobile menu sync — route migration guide

## What changed (backend)

| Before | After | Who uses it |
|--------|-------|-------------|
| `POST /customer-menus` | **`POST /customer-menus/sync`** | Flutter — sync active hydrated menu |
| *(collided)* | `POST /customer-menus` | Angular web — **create** menu `{ id_user, data }` |

**Code:** `CustomersMenusController.syncActiveMenuForToken` moved from `@Post()` → `@Post('sync')` in `src/customers/menus/customers-menus.controller.ts`.

**Why:** Nest registered two handlers on the same `POST /customer-menus`. The Flutter sync DTO only allows `created_at` / `updated_at`. With `forbidNonWhitelisted: true`, the web create body `{ id_user, data }` was rejected with **400**. Separating paths fixes web save and keeps mobile sync explicit (same idea as `POST /customers/sync-routine`).

**Unchanged mobile paths** (still valid):

- `POST /customer-menus/active/:id_user`
- `POST /customer-menus/client/:id_user`
- `POST /customer-menus/history`
- `POST /customer-menus/history/:id_user`

Body, auth, and response shape of sync are **unchanged**.

---

## How Flutter must adapt

### 1. Update the sync URL only

Replace every call to bare `POST /customer-menus` used for **menu cache sync** with:

```http
POST /customer-menus/sync
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "created_at": "<ISO or null>",
  "updated_at": "<ISO or null>"
}
```

Search the app for strings / constants like:

- `'/customer-menus'`
- `"/customer-menus"`
- `'customer-menus'` used with `dio.post` / `http.post` for sync

Typical sketch:

```dart
// BEFORE (broken after this backend deploy)
await dio.post('/customer-menus', data: stamp);

// AFTER
await dio.post('/customer-menus/sync', data: stamp);
```

If you centralize paths in one file (recommended):

```dart
abstract final class MenuApiPaths {
  /// Active menu sync (JWT sub). Was previously bare POST /customer-menus.
  static const sync = '/customer-menus/sync';
  static String client(int idUser) => '/customer-menus/client/$idUser';
  static String active(int idUser) => '/customer-menus/active/$idUser';
  static const history = '/customer-menus/history';
}
```

### 2. Do not change the request body

Still send only the cache stamp:

```json
{ "created_at": null, "updated_at": null }
```

or the last persisted stamps from a successful sync. Do **not** send `id_user` or `data` on this endpoint.

### 3. Do not change response handling

Same as before:

- `200` + `{ "isUpToDate": true }` → keep local cache
- `200` + `{ "isUpToDate": false, "created_at", "updated_at", "data" }` → replace local menu and store stamps

Auth remains JWT from `POST /customers/login` (user number). No `RolesGuard`.

### 4. Avoid confusing sync with staff create

After this change, **`POST /customer-menus`** expects staff JWT + body:

```json
{ "id_user": 123, "data": { "planType": "estricto", "days": { } } }
```

That is the **Angular coach/owner create API**. Mobile must **not** call bare `POST /customer-menus` for sync; it will fail validation or create unintended menus if somehow authorized.

### 5. Optional: aliases already work

If the app already uses `POST /customer-menus/client/{id_user}` or `/active/{id_user}` for sync, **no code change is required** for those calls. Only the preferred “no path param” entry point moved to `/sync`.

### 6. Smoke-test checklist

1. Login with customer user number → token OK.
2. First sync: `POST /customer-menus/sync` with `{ "created_at": null, "updated_at": null }` → `200`, `isUpToDate: false`, menu `data` present (or 404 if no menu).
3. Second sync with returned stamps → `200`, `isUpToDate: true`.
4. Confirm old URL `POST /customer-menus` with sync body is **not** used (web create path).

---

## Related docs

- Full sync contract: [`ACTIVE-MENU-HYDRATED.md`](./ACTIVE-MENU-HYDRATED.md)
- Tags / hydrate: [`MENU-TAGS.md`](./MENU-TAGS.md)

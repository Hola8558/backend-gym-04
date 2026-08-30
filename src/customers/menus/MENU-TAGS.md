# Menu tags — where macros live

Mini-doc for the **tag snapshots** that mirror the web menu creator metrics bar.
Applies to persisted `customer_menus.data` (Angular Save) and to Flutter `GET /customer-menus` after hydrate.

All tag numbers are **integers** (`Math.round`, same as creator `menuRoundInt`). Example: `5.6` → `6`.

---

## Tag fields (every snapshot)

| Field | Meaning (creator chip) |
|-------|-------------------------|
| `fats` | Total / average fats (g) |
| `protein` | Total / average protein (g) |
| `carbs` | Total / average carbs (g) |
| `kcal` | Total / average calories |
| `foods` | Recipe (meal) card count |
| `ingredients` | Standalone ingredient card count (not nested under recipes) |

---

## Estricto — total per day

Tags stay at the **root**, keyed by weekday:

```json
{
  "planType": "estricto",
  "days": {
    "fri": {
      "platters": [
        {
          "color": "blue",
          "note": "Prep the night before",
          "timeWindow": { "from": "07:00", "to": "09:00" },
          "items": [ /* … */ ]
        }
      ]
    }
  },
  "tags": {
    "mon": { "fats": 0, "protein": 0, "carbs": 0, "kcal": 0, "foods": 0, "ingredients": 0 },
    "fri": { "fats": 6, "protein": 40, "carbs": 37, "kcal": 327, "foods": 1, "ingredients": 0 }
  }
}
```

- **Position:** `data.tags[day]`
- **Value:** sum of all items in that day’s platters (same as creator when that day is selected)
- **`platters[j].name`:** custom title, or `null` → i18n “Bloque de alimentación” / “Platter / snack” (see [`MENU-PLATTER-NAMES.md`](./MENU-PLATTER-NAMES.md))
- **`platters[j].note` / `platters[j].timeWindow`:** per Bloque de alimentación (estricto header buttons)
- Weekdays: `mon` | `tue` | `wed` | `thu` | `fri` | `sat` | `sun`

---

## Dinámico — average per platter (group)

There is **no** global root `tags`. Each group carries its own snapshot:

```json
{
  "planType": "dinamico",
  "groups": [
    {
      "name": "Platter/snack 1",
      "tags": {
        "fats": 6,
        "protein": 40,
        "carbs": 37,
        "kcal": 327,
        "foods": 1,
        "ingredients": 0
      },
      "timeWindow": { "from": "07:00", "to": "09:00" },
      "options": [
        {
          "color": "green",
          "note": "Eat within 30 minutes of finishing workout",
          "items": [ /* option A */ ]
        },
        {
          "color": "blue",
          "note": null,
          "items": [ /* option B */ ]
        }
      ]
    }
  ]
}
```

- **Position:** `data.groups[i].tags`
- **Value:** average across **that group’s options only** (same as creator when that platter is selected)
- **`timeWindow`:** optional per group (`{ from, to }` as `HH:mm`, or `null`). Dinámico only — not used in estricto.
- **`options[j].note`:** optional coach note **per option** (`null` when empty). Dinámico only.
- Legacy menus may still have a root `tags` object; Flutter hydrate **removes** it and rewrites per-group tags

---

## How Flutter GET builds tags

After ingredient hydration:

1. Round recipe `macros` to integers
2. Recompute tags from hydrated items
3. Estricto → root `tags[day]`; dinámico → `groups[i].tags` (drop root `tags`)

See `utils/attach-menu-tags.util.ts`.

---

## Web list cards

- Estricto card: sum of all `tags[day]`
- Dinámico card: sum of each `groups[i].tags` (one expected option per platter)

---

## Related files

| Area | File |
|------|------|
| Angular build/persist | `gym-page-v4/.../utils/menu-plan-tags.util.ts`, `menu-plan-persist.util.ts` |
| Flutter attach | `utils/attach-menu-tags.util.ts` |
| Full Flutter API | `ACTIVE-MENU-HYDRATED.md` |

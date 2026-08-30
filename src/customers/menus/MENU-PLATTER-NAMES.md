# Platter / option display names

How titles are stored in `customer_menus.data` and how clients should show them.

## Rule

| Stored `name` | Display |
|---------------|---------|
| non-empty custom string | use it as-is (user typed it) |
| `null` / missing / `""` | i18n default by **plan type** + **app language** |

Do **not** bake a translated default into JSON at save time. That freezes one locale (e.g. Spanish “Bloque…” shown as English “Option 1” in Flutter).

## Defaults

### Estricto (`planType: "estricto"`)

Per platter under `days.*.platters[]`:

- **EN:** `Platter / snack`
- **ES:** `Bloque de alimentación`

Keys (web): `MENUS.DETAIL.PLATTER_LABEL`

### Dinámico (`planType: "dinamico"`)

Per option under `groups[].options[]` (1-based index in that group):

- **EN:** `Option {{n}}`
- **ES:** `Opción {{n}}`

Keys (web): `MENUS.DETAIL.OPTION_DEFAULT_NAME`

## JSON examples

**Estricto — default title (Flutter resolves label):**

```json
{
  "color": "blue",
  "name": null,
  "note": null,
  "timeWindow": { "from": "07:00", "to": "09:00" },
  "items": []
}
```

**Estricto — custom title:**

```json
{
  "color": "blue",
  "name": "Desayuno alto en proteína",
  "note": null,
  "timeWindow": null,
  "items": []
}
```

**Dinámico — default Option 1 / Opción 1:**

```json
{
  "color": "green",
  "name": null,
  "note": null,
  "items": []
}
```

## Flutter parsing

```text
if (name != null && name.trim().isNotEmpty) {
  show name
} else if (planType == estricto) {
  show localized "Platter / snack" | "Bloque de alimentación"
} else {
  show localized "Option $index" | "Opción $index"  // index = 1..n in group.options
}
```

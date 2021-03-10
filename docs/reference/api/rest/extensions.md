---
pageClass: page-reference
---

# Extensions

<div class="two-up">
<div class="left">

The extensions endpoints are used by the Admin App to retrieve what extensions to install.

</div>
<div class="right">

[[toc]]

</div>
</div>

---

## List Interfaces

List the available interfaces in the project.

<div class="two-up">
<div class="left">

### Query Parameters

This endpoint doesn't currently support any query parameters.

### Returns

An array of interface extension keys.

</div>
<div class="right">

### `GET /extensions/interfaces`

```json
// Response

{
	"data": ["custom-wysiwyg", "stocks"]
}
```

</div>
</div>

---

## List Displays

List the available displays in the project.

<div class="two-up">
<div class="left">

### Query Parameters

This endpoint doesn't currently support any query parameters.

### Returns

An array of display extension keys.

</div>
<div class="right">

### `GET /extensions/displays`

```json
// Response

{
	"data": ["related-values"]
}
```

</div>
</div>

---

## List Layouts

List the available layouts in the project.

<div class="two-up">
<div class="left">

### Query Parameters

This endpoint doesn't currently support any query parameters.

### Returns

An array of layout extension keys.

</div>
<div class="right">

### `GET /extensions/layouts`

```json
// Response

{
	"data": ["map", "calendar"]
}
```

</div>
</div>

---

## List Modules

List the available modules in the project.

<div class="two-up">
<div class="left">

### Query Parameters

This endpoint doesn't currently support any query parameters.

### Returns

An array of module extension keys.

</div>
<div class="right">

### `GET /extensions/modules`

```json
// Response

{
	"data": ["bookings"]
}
```

</div>
</div>

---

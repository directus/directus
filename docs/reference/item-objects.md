# Item Objects

> TK

## Syntax

* **Field** — Any valid root field or [relational field](#)
* **Value** — Any valid static value, or [dynamic variable](#)

```
{
	<operator>: <value>
}
```

### Example

```json
{
	"title": "Directus"
}
```

## Relational

You can set related values by nesting field names. For example, if you have a relational [Many-to-One](#)
`author` field, you can set a rule for the `author.name` field using the following syntax.

```json
{
	"author": {
		"name": "Rijk van Zanten"
	}
}
```

## Dynamic Variables

In addition to static values, you can also set _dynamic_ values using the following variables.

* `$CURRENT_USER` — The primary key of the currently authenticated user
* `$CURRENT_ROLE` — The primary key of the role for the currently authenticated user
* `$NOW` — The current timestamp

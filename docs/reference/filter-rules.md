# Filter Rules

> Permissions, validation, and the API's `filter` parameter all rely on a specific JSON structure to define their rules. This page describes the syntax for creating flat, relational, or complex filter rules.

## Syntax

* **Field** — Any valid root field, [relational field](#), or [logical operator](#)
* **Operator** — Any valid [API operator](#) prefaced with an underscore
* **Value** — Any valid static value, or [dynamic variable](#)

```
{
	<field>: {
		<operator>: <value>
	}
}
```

### Examples

```json
{
	"title": {
		"_contains": "Directus"
	}
}
```

```json
{
	"owner": {
		"_eq": "$CURRENT_USER"
	}
}
```

```json
{
	"datetime": {
		"_lte": "$NOW"
	}
}
```

## Relational

You can target related values by nesting field names. For example, if you have a relational [Many-to-One](#)
`author` field, you can set a rule for the `author.name` field using the following syntax.

```json
{
	"author": {
		"name": {
			"_eq": "Rijk van Zanten"
		}
	}
}
```

## Logical Operators

You can nest or group multiple rules using the `_and` or `_or` logical operators. Each operator holds an array of rules, allowing for more complex filtering.

```json
{
  "_or": [
    {
      "_and": [
        {
          "owner": {
            "_eq": "$CURRENT_USER"
          }
        },
        {
          "status": {
            "_in": [
              "published",
              "draft"
            ]
          }
        }
      ]
    },
    {
      "_and": [
        {
          "owner": {
            "_neq": "$CURRENT_USER"
          }
        },
        {
          "status": {
            "_in": [
              "published"
            ]
          }
        }
      ]
    }
  ]
}
```

## Dynamic Variables

In addition to static values, you can also filter against _dynamic_ values using the following variables.

* `$CURRENT_USER` — The primary key of the currently authenticated user
* `$CURRENT_ROLE` — The primary key of the role for the currently authenticated user
* `$NOW` — The current timestamp

# Filter Rules

> Permissions, validation, and the API's `filter` parameter all rely on a specific JSON structure to define their rules.
> This page describes the syntax for creating flat, relational, or complex filter rules.

[[toc]]

## Syntax

- **Field** — Any valid root field, [relational field](/reference/filter-rules#relational), or
  [logical operator](/reference/filter-rules#logical-operators)
- **Operator** — Any valid [API operator](/reference/filter-rules#supported-operators) prefaced with an underscore
- **Value** — Any valid static value, or [dynamic variable](/reference/filter-rules#dynamic-variables)

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

## Filter Operators

| Operator     | Description                            |
| ------------ | -------------------------------------- |
| `_eq`        | Equal to                               |
| `_neq`       | Not equal to                           |
| `_lt`        | Less than                              |
| `_lte`       | Less than or equal to                  |
| `_gt`        | Greater than                           |
| `_gte`       | Greater than or equal to               |
| `_in`        | Exists in one of the values            |
| `_nin`       | Not in one of the values               |
| `_null`      | It is null                             |
| `_nnull`     | It is not null                         |
| `_contains`  | Contains the substring                 |
| `_ncontains` | Doesn't contain the substring          |
| `_between`   | The value is between two values        |
| `_nbetween`  | The value is not between two values    |
| `_empty`     | The value is empty (null or falsy)     |
| `_nempty`    | The value is not empty (null or falsy) |

The following operators are **only available in validation permissions**:

| Operator                | Description               |
| ----------------------- | ------------------------- |
| `_submitted`            | Field has to be submitted |
| `_regex` <sup>[1]</sup> | Field has to match regex  |

<sup>[1]</sup> JavaScript "flavor" regex. Make sure to escape backslashes.

## Relational

You can target related values by nesting field names. For example, if you have a relational Many-to-One `author` field,
you can set a rule for the `author.name` field using the following syntax.

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

You can nest or group multiple rules using the `_and` or `_or` logical operators. Each operator holds an array of rules,
allowing for more complex filtering.

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
						"_in": ["published", "draft"]
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
						"_in": ["published"]
					}
				}
			]
		}
	]
}
```

## Dynamic Variables

In addition to static values, you can also filter against _dynamic_ values using the following variables.

- `$CURRENT_USER` — The primary key of the currently authenticated user
- `$CURRENT_ROLE` — The primary key of the role for the currently authenticated user
- `$NOW` — The current timestamp

@TODO put this somewhere appropriate

The `filter` parameter, permissions, and validation all rely on a JSON structure to define the permissions:

```
{
	<field>: {
		<operator>: <value>
	}
}
```

For example:

```json
{
	"title": {
		"_contains": "Directus"
	}
}
```

## Relational

You can target related values by nesting the field name of the related collection under the field name
of the relational field:

```json
{
	"author": {
		"name": {
			"_eq": "Rijk"
		}
	}
}
```

## And / Or

You can nest multiple filter objects under a `_and` or `_or` key to group filters under more advanced
logical operations:

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

# Command Line Interface

> TK

### Examples

#### Administrator creation

```
ROLE_ID=$(npx directus roles create --name Administrator --admin)
npx directus users create --email admin@example.com --password password --role $ROLE_ID
```

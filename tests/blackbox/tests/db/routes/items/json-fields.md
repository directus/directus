# JSON Fields Function Tests

This test suite validates the `json()` function for extracting specific values from JSON fields in Directus.

## Overview

The `json()` function allows you to extract specific paths from JSON fields in your queries:

```
GET /items/products?fields=id,name,json(metadata.color)
```

## Test Structure

### Seed Data ([json-fields.seed.ts](json-fields.seed.ts))

Creates a `test_items_json_products` collection with:
- **id**: Primary key (integer, uuid, or string depending on test type)
- **name**: String field
- **metadata**: JSON field with nested objects, arrays, and various data types
- **settings**: JSON field with optional nested values and null cases

The seed data includes 5 products with different JSON structures to test:
- Simple property extraction (`color`, `brand`)
- Nested object paths (`dimensions.width`, `dimensions.height`)
- Array indexing (`tags[0]`, `tags[1]`)
- Deeply nested paths (`variants[0].sku`, `variants[0].price`)
- Null and missing values
- Empty arrays

### Test Cases ([json-fields.test.ts](json-fields.test.ts))

#### Basic Extraction Tests
1. **Simple path** - `json(metadata.color)` → extracts `"red"`
2. **Nested object path** - `json(metadata.dimensions.width)` → extracts `10`
3. **Array index** - `json(metadata.tags[0])` → extracts `"electronics"`
4. **Nested array and object** - `json(metadata.variants[0].sku)` → extracts `"SKU-001"`

#### Advanced Tests
5. **Multiple JSON fields** - Extract from both `metadata` and `settings`
6. **Null/missing values** - Gracefully returns `null` for missing paths
7. **Empty arrays** - Returns `null` when accessing out-of-bounds indices
8. **Combined with regular fields** - Mix JSON extraction with full field retrieval

#### Integration Tests
9. **With filters** - Filter results and extract JSON values
10. **With sorting** - Sort results and extract JSON values
11. **With pagination** - Paginate results with JSON extraction

#### CRUD Operations
12. **POST** - Create item and extract JSON in response
13. **PATCH** - Update item and extract JSON in response
14. **GET by ID** - Retrieve single item with JSON extraction

#### Error Handling
15. **Non-JSON field** - Returns 400 error
16. **Non-existent field** - Returns 400 error
17. **Invalid syntax** - Returns 400 error (e.g., `json(metadata)` without path)

## Field Aliasing

The `json()` function generates field aliases using this pattern:

```
json(metadata.color) → metadata_color_json
json(data.items[0].name) → data_items_0__name_json
json(settings.theme) → settings_theme_json
```

**Rules:**
- Dots (`.`) become underscores (`_`)
- Brackets (`[` and `]`) become double underscores (`__`)
- Function name (`json`) is appended at the end

## GraphQL Support

The tests also validate GraphQL queries using the `_func` pattern:

```graphql
query {
  products {
    metadata_func {
      color: json(path: "color")
      brand: json(path: "brand")
    }
  }
}
```

## Running the Tests

```bash
# Run all blackbox tests
pnpm test:blackbox

# Run only json-fields tests
pnpm --filter tests-blackbox test json-fields

# Run with specific database vendor
TEST_DB=postgres pnpm --filter tests-blackbox test json-fields
```

## Database Coverage

These tests run against all supported database vendors:
- PostgreSQL (using JSONB operators: `->`, `->>`)
- MySQL (using `JSON_EXTRACT` and `JSON_UNQUOTE`)
- SQLite (using `json_extract`)
- Microsoft SQL Server (using `JSON_VALUE`)
- Oracle (using `JSON_VALUE`)
- CockroachDB (using PostgreSQL JSONB operators)

## Related Files

- [api/src/database/helpers/fn/dialects/postgres.ts](../../../../../../../api/src/database/helpers/fn/dialects/postgres.ts) - PostgreSQL implementation
- [api/src/database/helpers/fn/json/parse-function.ts](../../../../../../../api/src/database/helpers/fn/json/parse-function.ts) - JSON path parser
- [api/src/database/run-ast/utils/apply-function-to-column-name.ts](../../../../../../../api/src/database/run-ast/utils/apply-function-to-column-name.ts) - Field alias generator

# Types

> Every Field is configured with a specific "Type" which defines how its data is stored in the database. Often called a
> data-type, these are important in ensuring field values are saved cleanly and in a standardized format.

When creating a new field you'll be asked to choose a specific data-type. It's important to understand their purpose,
because changing them later can cause massive data loss. For that reason, once you set a field's type, it can't be
changed from within Directus.

The Type dictates the specific format of a field's _value_ when saving it to the database, helping to keep your data
clean, standardized and valid. The type also tells the Directus API how to return your data, for example the `CSV` type
is returned as an array of strings.

#### Relevant Guides

- [Creating a Field](/guides/fields/#creating-a-field)

## Directus Data Type Superset

Directus uses its built-in database abstraction to properly support all the different SQL vendors. However, these
vendors do not share support for the same datatypes, instead, each SQL vendor maintains their own list. To standardize
all of these differences, Directus has a single _superset_ of types that map to the vendor-specific ones.

- **String** — A shorter set of characters with a configurable max length
- **Text** — A longer set of characters with no real-world max length
- **Boolean** — A True or False value
- **Binary** — The data of a binary file
- **Integer** — A number without a decimal point
- **Big Integer** — A larger number without a decimal point
- **Float** — A less exact number with a floating decimal point
- **Decimal** — A higher precision, exact decimal number often used in finances
- **Timestamp** — A date, time, and timezone saved in ISO 8601 format
- **DateTime** — A date and time saved in the database vendor's format
- **Date** — A date saved in the database vendor's format
- **Time** — A time saved in the database vendor's format
- **JSON** — A value nested in JavaScript Object Notation
- **CSV** — A comma-separated value, returned as an array of strings
- **UUID** — A universally unique identifier saved in UUIDv4 format
- **Hash** — A string hashed using argon2 cryptographic hash algorithm

::: tip Aliases

There is also an **Alias** type that is used for all fields that do not have a corresponding database column. This
includes presentation-only fields, and certain relational fields, such as the One-to-Many.

:::

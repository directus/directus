# Field Transforms

Directus contains a couple special field flags that can be used to alter the IO of a fields value when it's being used
through the API. This is used—among other things—for casting boolean values to JSON `true` / `false`, or converting
DB-date formats to ISO8601.

These flags are stored in the `special` field of `directus_fields`.

[[toc]]

## Hash

`hash`

Hash the value using argon2 on create/update.

## UUID

`uuid`

Generate a new UUID on creation.

## Boolean

`boolean`

Cast the value to/from a JSON boolean (`true` / `false`).

## JSON

`json`

Cast the value to/from a JSON object.

## CSV

`csv`

Cast the value from a JSON array of strings to a CSV in the database (and vice versa).

## Conceal

`conceal`

Return the value concealed in the API. This will replace the true stored value with `********`.

## User Created

`user-created`

Save the currently authenticated user on creation.

## User Updated

`user-updated`

Save the currently authenticated user on update.

## Role Created

`role-created`

Save the currently authenticated user's role on create.

## Role Updated

`role-updated`

Save the currently authenticated user's role on update.

## Date Created

`date-created`

Save the current date on create.

## Date Updated

`date-updated`

Save the current date on update.

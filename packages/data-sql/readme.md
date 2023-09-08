# `@directus/data-sql`

A package which all SQL drivers use. Is consists out of three individual parts:

- A set of types, which defines the abstract SQL query language.
- A query converter, which converts an abstract query into the abstract SQL query.
- A database response converter which converts the flat database response into a nested object in regards to tables that
  have been joined. It also replaces the actual column name from the database, with an user specified alias if one was
  provided.
- Some smaller utility functions, like for converting operators into SQL equivalents

## Installation

```
npm install @directus/data-sql
```

## Current architecture of this package

To get an overview of how the package is organized regarding it's files, directories and the dependencies between them,
run `pnpm run depcruise` and have a look in the created `dependency-graph.svg` image.

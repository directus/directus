# `@directus/data-sql`

A package which all SQL drivers use. Is consists out of three individual parts:

- A set of types, which defines the abstract SQL query language.
- A converter, which converts an abstract query into the abstract SQL.
- Some utility functions

## Installation

```
npm install @directus/data-sql
```

## Current architecture of this package

To get an overview of how the package is organized regarding it's files, directories and the dependencies between them,
run `pnpm run depcruise` and have a look in the created `dependency-graph.svg` image.

# Internal Helpers

> Below are some functions you may find helpful when working with data and values within Directus.

## Title Formatter

Directus uses [Database Mirroring](/concepts/platform-overview) to create its underlying data model based on your custom
schema. Therefore the App needs a reliable way of converting any raw table name, field name, or other technical value
into a prettified format that is human-readable. At its core, the Title Formatter converts any string into title-case
with proper whitespace. It also covers acronyms, initialisms, common proper nouns, so each is output properly. Some
example conversion include:

| Original String              | Formatted Title                   |
| ---------------------------- | --------------------------------- |
| `snowWhiteAndTheSevenDwarfs` | `Snow White and the Seven Dwarfs` |
| `NewcastleUponTyne`          | `Newcastle upon Tyne`             |
| `brighton_by_the_sea`        | `Brighton by the Sea`             |
| `new_ipad_ftp_app`           | `New iPad FTP App`                |

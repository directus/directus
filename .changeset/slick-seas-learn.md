---
'@directus/api': major
---

Fixed snapshots including untracked collections

::: notice
If you previously relied on database-only tables being transferred via snapshots, please note that this behavior has changed. These tables are no longer tracked in snapshots. As a result, assuming `PRE` refers to <=11.9.3 and `POST` refers to >11.9.3 instances the following behavior now apply:

- Creating a snapshot on a `PRE` instance that includes a database-only `Table A` and calling `diff` + `apply` on a `POST` instance will create `Table A` on the `POST` instance.
- Creating snapshot on a `POST` instance that includes a database-only `Table A`, and calling `diff` + `apply` on a `PRE` instance that also includes `Table A` will drop `Table A` from the `PRE` instance.
- Creating a snapshot on a `POST` instance (upgraded from a `PRE` instance) that includes a database-only `Table A`, and calling `diff` + `apply` on a different `POST` instance will result in no changes.
- Creating a snapshot on one `PRE` instance and calling `diff` + `apply` on another `PRE` instance will either create or drop `Table A`, depending on whether it exists on the source and/or target `PRE` instance.


Please review your snapshot workflows to ensure these changes will not result in unexpected behaviour.
:::




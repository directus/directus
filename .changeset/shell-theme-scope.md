---
'@directus/types': major
'@directus/themes': major
'@directus/app': major
---

Updated header and navigation bar base design and merged their theme properties into a new shell scope

::: notice

- The theme properties `navigation.background`, `navigation.backgroundAccent`, `navigation.borderWidth`, `navigation.borderColor`, `header.background`, `header.borderWidth`, and `header.borderColor` have been removed and replaced by `shell.background`, `shell.backgroundAccent`, `shell.borderWidth`, and `shell.borderColor`.
- Custom themes overriding any of these removed properties must migrate to the new `shell` scope. The corresponding CSS variables change from `--theme--navigation--background`, `--theme--navigation--background-accent`, `--theme--navigation--border-*`, `--theme--header--background`, and `--theme--header--border-*` to `--theme--shell--background`, `--theme--shell--background-accent`, and `--theme--shell--border-*`.

:::

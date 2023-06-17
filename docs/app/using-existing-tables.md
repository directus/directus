---
description:
  Using Directus with existing tables has some requirements and restrictions. 
readTime: 3 min read
---

# Using exisiting tables

Directus recognizing tables only, when they adhere to vertain rules. Since different CMS systems handle SQL differently, it is recommended to first check how the foreign source structure its data. One main area of focus should be relations. 

## 1. Check Primary Keys

Directus does not support compund primary keys! This can be a critical issue, when the relational model of the foreign source defines a mm pivot table with compound, that is: more that one fields. In that case it is required to change the table structure by adding an extra field that is used as primary key. 

::: details Example:
TYPO3, a php-based Enterprise CMS, handles its mm-relations using compound keys in this way:

```sql{2-3,6}
CREATE TABLE `rwfm_mm_award_awardcategory` (
  `uid_local` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `uid_foreign` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `sorting` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `sorting_foreign` int(10) UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`uid_local`,`uid_foreign`),
  KEY `uid_local` (`uid_local`),
  KEY `uid_foreign` (`uid_foreign`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

In order to use this table in Directus, it must be changed to:

```sql{2,8}
CREATE TABLE `rwfm_mm_award_awardcategory` (
  `id` int(11) NOT NULL AUTO_INCREMENT, // [!code  ++]
  `uid_local` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `uid_foreign` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `sorting` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `sorting_foreign` int(10) UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`uid_local`,`uid_foreign`), // [!code  --]
  PRIMARY KEY (`id`), // [!code  ++]
  KEY `uid_local` (`uid_local`),
  KEY `uid_foreign` (`uid_foreign`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
:::

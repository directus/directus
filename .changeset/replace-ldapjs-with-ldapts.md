---
"@directus/api": patch
---

Replace deprecated ldapjs library with modern ldapts for LDAP authentication. The ldapts library provides a promise-based API, better TypeScript support, and is actively maintained. This change maintains full backward compatibility with existing LDAP configuration options.


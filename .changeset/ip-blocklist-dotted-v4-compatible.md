---
'@directus/utils': patch
---

Fixed `IpBlocklist` not matching a denied IPv4 written as `::a.b.c.d`, while the equivalent `::a9fe:a9fe` spelling was matched

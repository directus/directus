---
'@directus/utils': patch
---

Classified the embedded IPv4 of IPv6 transition forms (IPv4-compatible, NAT64, 6to4) in `IpBlocklist.checkAddress` so they cannot bypass an IPv4 deny rule

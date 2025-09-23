---
"@directus/api": patch
---

Replace node-schedule with cron library to improve scheduled flows reliability

Addresses an issue where scheduled flows would stop executing after approximately 25 days due to a known bug in the node-schedule library. The replacement uses the actively maintained 'cron' package from kelektiv/node-cron which provides better long-term reliability, active maintenance, and improved timezone handling.

**Key improvements:**
- Addresses the 25-day execution bug reported in node-schedule
- Better timezone support (respects TZ environment variable)
- Uses native validation functions from the cron package
- Maintains existing SynchronizedClock mechanism for multi-instance coordination
- Preserves all existing cron expression formats and functionality

**Breaking changes:** None - this is a drop-in replacement that maintains full backward compatibility.

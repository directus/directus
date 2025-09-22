---
"@directus/api": patch
---

Replace node-schedule with cron library to fix long-running scheduled flows

Fixes an issue where scheduled flows would stop executing after approximately 25 days due to a known bug in the node-schedule library. The replacement uses the actively maintained 'cron' package from kelektiv/node-cron which provides better reliability and timezone handling.

**Key improvements:**
- Resolves the 25-day execution bug in scheduled flows
- Better timezone support (respects TZ environment variable)
- Uses native validation functions from the cron package
- Maintains existing SynchronizedClock mechanism for multi-instance coordination
- Preserves all existing cron expression formats and functionality

**Breaking changes:** None - this is a drop-in replacement that maintains full backward compatibility.

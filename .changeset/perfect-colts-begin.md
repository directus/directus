---
'@directus/api': patch
---

Updated the `send` method in `MailService` to return the promise with info, adapted use within `@directus/api` to not
block until mails have been sent

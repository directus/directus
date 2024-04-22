---
description: A guide on how to build custom Email Templates in Directus.
readTime: 1 min read
---

# Email Templates

> Templates can be used to add custom templates for your emails, or to override the system emails used for things like
> resetting a password or inviting a user.

## 1. Create a template file

Custom email templates are stored in the configured `EMAIL_TEMPLATES_PATH` location, which defaults to the `./templates`
folder relative to your project. Every template is a [`liquid`](https://liquidjs.com) file that can render whatever you
want!

```
/templates/<template-name>.liquid
```

To replace a system template with your own, simply name it `password-reset` or `user-invitation` for the password reset
or user invite emails respectively.

::: tip Variables

When overriding the default email templates, make sure to include the `url` variable somewhere. A password reset email
wouldn't be that useful without the link to go reset your password!

:::

## Guides

Learn how to build email templates with our official guides:

<GuidesListExtensions type="Email Templates" />

<script setup>
import GuidesListExtensions from '@/components/guides/GuidesListExtensions.vue';
</script>

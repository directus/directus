---
description:
  Webhooks are configured within the App (no code required) and send HTTP requests when a specific event is triggered.
readTime: 2 min read
---

# Webhooks

> Webhooks are configured within the App (no code required) and send HTTP requests when a specific event is triggered.
> [Learn more about Webhooks](https://en.wikipedia.org/wiki/Webhook).

::: warning

Webhooks are a deprecated feature and will be removed from the platform. This functionality has been fully replaced by
[Flows](/app/flows).

:::

## Creating Webhooks

1. Navigate to **Settings <span mi icon dark>chevron_right</span> Webhooks**
2. Click <span mi btn>add</span> in the header
3. Complete the **other webhook form fields** outlined below

- **Name** — A name to help remember this webhooks purpose
- **Method** — Send as either a HTTP `GET` or `POST` request
- **URL** — The URL to send the request to
- **Status** — Whether the webhook is active (enabled) or inactive (disabled)
- **Data** — Whether the event's data should be sent along with the request
- **Request Headers** — Custom headers that will be added to the webhook request
- **Trigger Actions** — The specific actions that will trigger the event
- **Trigger Collections** — The specific collections for which the above actions will trigger events

## Disabling Webhooks

1. Navigate to **Settings <span mi icon dark>chevron_right</span> Webhooks <span mi icon dark>chevron_right</span>
   [Webhook]**
2. Set the **status field to inactive**

## Deleting Webhooks

1. Navigate to **Settings <span mi icon dark>chevron_right</span> Webhooks <span mi icon dark>chevron_right</span>
   [Webhook]**
2. Click <span mi btn dngr>delete</span> in the header
3. Confirm this decision by clicking **Delete** in the dialog

::: danger Irreversible Change

This action is permanent and can not be undone. Please proceed with caution.

:::

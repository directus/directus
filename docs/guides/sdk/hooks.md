---
contributors: Tim de Heiden
description: 
---

# SDK Integrations and Customization

The SDK allows for a couple fo ways to integrate or customize how it works.

## Global Request Hooks

- `onRequest`
- `onResponse`
- `onError`

### Hooks execution order

- global
- rest composable
- request options

## Custom Commands

To call custom endpoints you'll want to make a custom command to be used with the `rest.request` function.


---
description: Learn about the Directus Secure Extensions Framework to isolate and build trust in your extensions.
contributors: Nils Twelker, Kevin Lewis, Esther Agbaje
---

# Secure Extensions

The Secure Extensions Framework is designed to provide robust security to your data and maintain strict control over
interactions with the external environment. The main purpose is to allow configurations that limit how extensions access
your information and communicate externally.

The Secure Extensions Framework is available for API and Hybrid Extensions.

::: info Directus Marketplace

In the future, API and Hybrid extensions must be built with the Secure Extensions Framework to be distributed in the
Directus Marketplace (coming soon).

:::

## Understanding Isolates

An isolate is a secure environment to evaluate and execute extensions. The environment is given capabilities via an
`exec` function exposed by Directus. While the `exec` function has minimal default capabilities, it can be extended
through extension permissions.

Isolates only have access to
[JavaScript standard built-in objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects).
This means that common runtime functions such as `console` and `setTimeout` are not available.

## Creating Secure Extensions

When using the CLI provided with the Directus Extensions SDK to scaffold a new extension, you will be given the option
to create a Secure Extension. This will use our new templates for creating Secure Extensions.

You can run the CLI from your terminal with the following command:

```
npx create-directus-extension@latest
```

Secure Extensions have the following properties in the `package.json` file:

- A `secure` property with the value of `true`.
- A `permissions` property which is an array of required and optional permissions.

:::details Example Metadata

```json{3,8-19}
"directus:extension": {
	"debugger": true,
	"secure": true,
	"type": "endpoint",
	"path": "dist/index.js",
	"source": "src/index.js",
	"host": "^10.0.0",
	"permissions": [
		{
			"permission": "request",
			"allowed_urls": [
				"https://api.github.com/*"
			]
		},
		{
			"permission": "items-read",
			"optional": true
		}
	]
}
```

:::

## Permissions & Execution Types

The `exec` function has minimal default capabilities (called 'execution types'). More can be added by requiring or
requesting permissions in your `package.json` file.

[Check the list of execution types](/extensions/secure/execution-types).

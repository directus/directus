---
description: Learn about the Directus Sandboxed Extensions Framework to isolate and build trust in your extensions.
contributors: Nils Twelker, Kevin Lewis, Esther Agbaje
---

# Sandboxed Extensions

The Sandboxed Extensions Framework is designed to provide robust security to your data and maintain strict control over
interactions with the external environment by running extension code in an isolated _sandbox_. The main purpose of this
sandbox is to allow configurations that limit how extensions access your information and communicate externally.

The Sandboxed Extensions Framework is available for API and Hybrid Extensions.

## Understanding the Sandbox

The sandbox is a secure environment to evaluate and execute extensions. The environment is given capabilities via
virtual functions exposed through the `directus:api` module. Each function that's called through this isolate is checked
against the extension's configured permissions, making sure extensions aren't able to access any private data without
explicit consent.

Isolates only have access to
[JavaScript standard built-in objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects).
This means that common runtime functions such as `console` and `setTimeout` are not available.

## Creating Sandboxed Extensions

To mark your extension to use the sandbox, add the `sandbox` configuration to your extension's `package.json` file, and
set enabled to `true` as follows:

```json{6-9}
"directus:extension": {
	"type": "endpoint",
	"path": "dist/index.js",
	"source": "src/index.js",
	"host": "^10.7.0",
	"sandbox": {
		"enabled": true,
		"requestedScopes": {}
	}
}
```

## Registering Extensions

While the way individual extensions are instantiated is very similar to non-sandboxed extensions, there's some subtle
differences to be aware of given the difference of runtime. Please refer to
[Registering Extensions](/extensions/sandbox/register) for examples for each extension type.

## Permissions & Execution Types

The `requestedScopes` object controls what function scopes your extension requests to use, and what permissions your
extension needs for each of those scopes. Please refer to [Sandbox SDK](/extensions/sandbox/sandbox-sdk) for a reference
of all supported scopes.

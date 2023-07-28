---
editLink: false
---

# Function: readExtensions()

> **readExtensions**\<`Schema`\>(`type`): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> [`ReadExtensionOutput`](../interfaces/interface.ReadExtensionOutput.md)[], `Schema` \>

List the available extensions in the project.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                             | Description        |
| :-------- | :--------------------------------------------------------------- | :----------------- |
| `type`    | [`ExtensionTypes`](../type-aliases/type-alias.ExtensionTypes.md) | The extension type |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\<
[`ReadExtensionOutput`](../interfaces/interface.ReadExtensionOutput.md)[], `Schema` \>

An array of interface extension keys.

## Source

[rest/commands/read/extensions.ts:29](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/read/extensions.ts#L29)

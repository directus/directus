---
editLink: false
---

# Function: handlePressure()

> **handlePressure**(`options`): `RequestHandler`\< `ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`\< `string`,
> `any` \> \>

## Parameters

| Parameter | Type                                                                                                                            |
| :-------- | :------------------------------------------------------------------------------------------------------------------------------ |
| `options` | [`PressureMonitorOptions`](../type-aliases/type-alias.PressureMonitorOptions.md) & \{`error`: `Error`; `retryAfter`: `string`;} |

## Returns

`RequestHandler`\< `ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`\< `string`, `any` \> \>

## Source

[express.ts:5](https://github.com/directus/directus/blob/7789a6c53/packages/pressure/src/express.ts#L5)

---
editLink: false
---

# Class: PressureMonitor

## Constructors

### constructor()

> **new PressureMonitor**(`options` = `{}`): [`PressureMonitor`](class.PressureMonitor.md)

#### Parameters

| Parameter | Type                                                                             |
| :-------- | :------------------------------------------------------------------------------- |
| `options` | [`PressureMonitorOptions`](../type-aliases/type-alias.PressureMonitorOptions.md) |

#### Returns

[`PressureMonitor`](class.PressureMonitor.md)

#### Source

[monitor.ts:25](https://github.com/directus/directus/blob/7789a6c53/packages/pressure/src/monitor.ts#L25)

## Properties

### eventLoopDelay

> `private` **eventLoopDelay**: `number` = `0`

#### Source

[monitor.ts:19](https://github.com/directus/directus/blob/7789a6c53/packages/pressure/src/monitor.ts#L19)

---

### eventLoopUtilization

> `private` **eventLoopUtilization**: `number` = `0`

#### Source

[monitor.ts:20](https://github.com/directus/directus/blob/7789a6c53/packages/pressure/src/monitor.ts#L20)

---

### histogram

> `private` **histogram**: `IntervalHistogram`

#### Source

[monitor.ts:22](https://github.com/directus/directus/blob/7789a6c53/packages/pressure/src/monitor.ts#L22)

---

### memoryHeapUsed

> `private` **memoryHeapUsed**: `number` = `0`

#### Source

[monitor.ts:17](https://github.com/directus/directus/blob/7789a6c53/packages/pressure/src/monitor.ts#L17)

---

### memoryRss

> `private` **memoryRss**: `number` = `0`

#### Source

[monitor.ts:18](https://github.com/directus/directus/blob/7789a6c53/packages/pressure/src/monitor.ts#L18)

---

### options

> `private` **options**: `Required`\< [`PressureMonitorOptions`](../type-aliases/type-alias.PressureMonitorOptions.md)
> \>

#### Source

[monitor.ts:21](https://github.com/directus/directus/blob/7789a6c53/packages/pressure/src/monitor.ts#L21)

---

### timeout

> `private` **timeout**: `Timeout`

#### Source

[monitor.ts:23](https://github.com/directus/directus/blob/7789a6c53/packages/pressure/src/monitor.ts#L23)

## Accessors

### overloaded

> `get` overloaded(): `boolean`

#### Source

[monitor.ts:43](https://github.com/directus/directus/blob/7789a6c53/packages/pressure/src/monitor.ts#L43)

## Methods

### updateEventLoopUsage()

> `private` **updateEventLoopUsage**(): `void`

#### Returns

`void`

#### Source

[monitor.ts:75](https://github.com/directus/directus/blob/7789a6c53/packages/pressure/src/monitor.ts#L75)

---

### updateMemoryUsage()

> `private` **updateMemoryUsage**(): `void`

#### Returns

`void`

#### Source

[monitor.ts:69](https://github.com/directus/directus/blob/7789a6c53/packages/pressure/src/monitor.ts#L69)

---

### updateUsage()

> `private` **updateUsage**(): `void`

#### Returns

`void`

#### Source

[monitor.ts:63](https://github.com/directus/directus/blob/7789a6c53/packages/pressure/src/monitor.ts#L63)

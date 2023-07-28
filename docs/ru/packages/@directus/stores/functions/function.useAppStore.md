---
editLink: false
---

# Function: useAppStore()

> **useAppStore**(`pinia`?, `hot`?): `Store`\< `"appStore"`, `_UnwrapAll`\< `Pick`\< \{`accessTokenExpiry`: `Ref`\<
> `number` \>; `authenticated`: `Ref`\< `boolean` \>; `basemap`: `Ref`\< `string` \>; `error`: `Ref`\< `null` \>;
> `fullScreen`: `Ref`\< `boolean` \>; `hydrated`: `Ref`\< `boolean` \>; `hydrating`: `Ref`\< `boolean` \>; `navbarOpen`:
> `RemovableRef`\< `boolean` \>; `notificationsDrawerOpen`: `Ref`\< `boolean` \>; `sidebarOpen`: `RemovableRef`\<
> `boolean` \>;}, `"navbarOpen"` \| `"sidebarOpen"` \| `"notificationsDrawerOpen"` \| `"fullScreen"` \| `"hydrated"` \|
> `"hydrating"` \| `"error"` \| `"authenticated"` \| `"accessTokenExpiry"` \| `"basemap"` \> \>, `Pick`\<
> \{`accessTokenExpiry`: `Ref`\< `number` \>; `authenticated`: `Ref`\< `boolean` \>; `basemap`: `Ref`\< `string` \>;
> `error`: `Ref`\< `null` \>; `fullScreen`: `Ref`\< `boolean` \>; `hydrated`: `Ref`\< `boolean` \>; `hydrating`: `Ref`\<
> `boolean` \>; `navbarOpen`: `RemovableRef`\< `boolean` \>; `notificationsDrawerOpen`: `Ref`\< `boolean` \>;
> `sidebarOpen`: `RemovableRef`\< `boolean` \>;}, `never` \>, `Pick`\< \{`accessTokenExpiry`: `Ref`\< `number` \>;
> `authenticated`: `Ref`\< `boolean` \>; `basemap`: `Ref`\< `string` \>; `error`: `Ref`\< `null` \>; `fullScreen`:
> `Ref`\< `boolean` \>; `hydrated`: `Ref`\< `boolean` \>; `hydrating`: `Ref`\< `boolean` \>; `navbarOpen`:
> `RemovableRef`\< `boolean` \>; `notificationsDrawerOpen`: `Ref`\< `boolean` \>; `sidebarOpen`: `RemovableRef`\<
> `boolean` \>;}, `never` \> \>

Global application state

## Parameters

| Parameter | Type              |
| :-------- | :---------------- |
| `pinia`?  | `null` \| `Pinia` |
| `hot`?    | `StoreGeneric`    |

## Returns

`Store`\< `"appStore"`, `_UnwrapAll`\< `Pick`\< \{`accessTokenExpiry`: `Ref`\< `number` \>; `authenticated`: `Ref`\<
`boolean` \>; `basemap`: `Ref`\< `string` \>; `error`: `Ref`\< `null` \>; `fullScreen`: `Ref`\< `boolean` \>;
`hydrated`: `Ref`\< `boolean` \>; `hydrating`: `Ref`\< `boolean` \>; `navbarOpen`: `RemovableRef`\< `boolean` \>;
`notificationsDrawerOpen`: `Ref`\< `boolean` \>; `sidebarOpen`: `RemovableRef`\< `boolean` \>;}, `"navbarOpen"` \|
`"sidebarOpen"` \| `"notificationsDrawerOpen"` \| `"fullScreen"` \| `"hydrated"` \| `"hydrating"` \| `"error"` \|
`"authenticated"` \| `"accessTokenExpiry"` \| `"basemap"` \> \>, `Pick`\< \{`accessTokenExpiry`: `Ref`\< `number` \>;
`authenticated`: `Ref`\< `boolean` \>; `basemap`: `Ref`\< `string` \>; `error`: `Ref`\< `null` \>; `fullScreen`: `Ref`\<
`boolean` \>; `hydrated`: `Ref`\< `boolean` \>; `hydrating`: `Ref`\< `boolean` \>; `navbarOpen`: `RemovableRef`\<
`boolean` \>; `notificationsDrawerOpen`: `Ref`\< `boolean` \>; `sidebarOpen`: `RemovableRef`\< `boolean` \>;}, `never`
\>, `Pick`\< \{`accessTokenExpiry`: `Ref`\< `number` \>; `authenticated`: `Ref`\< `boolean` \>; `basemap`: `Ref`\<
`string` \>; `error`: `Ref`\< `null` \>; `fullScreen`: `Ref`\< `boolean` \>; `hydrated`: `Ref`\< `boolean` \>;
`hydrating`: `Ref`\< `boolean` \>; `navbarOpen`: `RemovableRef`\< `boolean` \>; `notificationsDrawerOpen`: `Ref`\<
`boolean` \>; `sidebarOpen`: `RemovableRef`\< `boolean` \>;}, `never` \> \>

## Source

node_modules/.pnpm/pinia@2.1.1_typescript@5.0.4_vue@3.3.4/node_modules/pinia/dist/pinia.d.ts:630

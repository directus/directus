---
editLink: false
---

# Function: useThemeStore()

> **useThemeStore**(`pinia`?, `hot`?): `Store`\< `"themes"`, `_UnwrapAll`\< `Pick`\< \{`currentAppearance`: `Ref`\<
> `"light"` \| `"dark"` \>; `currentTheme`: \{`dark`: `string`; `light`: `string`;}; `registerTheme`: (`theme`) =>
> `void`; `rules`: `ComputedRef`\< \{`foreground`: `string`;} \>; `themes`: \{`dark`:
> `{ name: string; appearance: "light" | "dark"; rules: { foreground: string; }; }`[]; `light`:
> `{ name: string; appearance: "light" | "dark"; rules: { foreground: string; }; }`[];};}, `"themes"` \|
> `"currentTheme"` \| `"currentAppearance"` \> \>, `Pick`\< \{`currentAppearance`: `Ref`\< `"light"` \| `"dark"` \>;
> `currentTheme`: \{`dark`: `string`; `light`: `string`;}; `registerTheme`: (`theme`) => `void`; `rules`:
> `ComputedRef`\< \{`foreground`: `string`;} \>; `themes`: \{`dark`:
> `{ name: string; appearance: "light" | "dark"; rules: { foreground: string; }; }`[]; `light`:
> `{ name: string; appearance: "light" | "dark"; rules: { foreground: string; }; }`[];};}, `"rules"` \>, `Pick`\<
> \{`currentAppearance`: `Ref`\< `"light"` \| `"dark"` \>; `currentTheme`: \{`dark`: `string`; `light`: `string`;};
> `registerTheme`: (`theme`) => `void`; `rules`: `ComputedRef`\< \{`foreground`: `string`;} \>; `themes`: \{`dark`:
> `{ name: string; appearance: "light" | "dark"; rules: { foreground: string; }; }`[]; `light`:
> `{ name: string; appearance: "light" | "dark"; rules: { foreground: string; }; }`[];};}, `"registerTheme"` \> \>

Returns a store, creates it if necessary.

## Parameters

| Parameter | Type              | Description                          |
| :-------- | :---------------- | :----------------------------------- |
| `pinia`?  | `null` \| `Pinia` | Pinia instance to retrieve the store |
| `hot`?    | `StoreGeneric`    | dev only hot module replacement      |

## Returns

`Store`\< `"themes"`, `_UnwrapAll`\< `Pick`\< \{`currentAppearance`: `Ref`\< `"light"` \| `"dark"` \>; `currentTheme`:
\{`dark`: `string`; `light`: `string`;}; `registerTheme`: (`theme`) => `void`; `rules`: `ComputedRef`\< \{`foreground`:
`string`;} \>; `themes`: \{`dark`: `{ name: string; appearance: "light" | "dark"; rules: { foreground: string; }; }`[];
`light`: `{ name: string; appearance: "light" | "dark"; rules: { foreground: string; }; }`[];};}, `"themes"` \|
`"currentTheme"` \| `"currentAppearance"` \> \>, `Pick`\< \{`currentAppearance`: `Ref`\< `"light"` \| `"dark"` \>;
`currentTheme`: \{`dark`: `string`; `light`: `string`;}; `registerTheme`: (`theme`) => `void`; `rules`: `ComputedRef`\<
\{`foreground`: `string`;} \>; `themes`: \{`dark`:
`{ name: string; appearance: "light" | "dark"; rules: { foreground: string; }; }`[]; `light`:
`{ name: string; appearance: "light" | "dark"; rules: { foreground: string; }; }`[];};}, `"rules"` \>, `Pick`\<
\{`currentAppearance`: `Ref`\< `"light"` \| `"dark"` \>; `currentTheme`: \{`dark`: `string`; `light`: `string`;};
`registerTheme`: (`theme`) => `void`; `rules`: `ComputedRef`\< \{`foreground`: `string`;} \>; `themes`: \{`dark`:
`{ name: string; appearance: "light" | "dark"; rules: { foreground: string; }; }`[]; `light`:
`{ name: string; appearance: "light" | "dark"; rules: { foreground: string; }; }`[];};}, `"registerTheme"` \> \>

## Source

node_modules/.pnpm/pinia@2.1.1_typescript@5.0.4_vue@3.3.4/node_modules/pinia/dist/pinia.d.ts:630

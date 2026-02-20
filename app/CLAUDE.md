# App CLAUDE.md

Vue 3 CMS app studio built with Vite and Pinia. See [root agents.md](../agents.md) for general project guidance.

## Vue Components

### Script block

- Always use `<script setup lang="ts">` — no Options API
- Block order enforced by ESLint: `<script>` → `<template>` → `<style>`
- Define props inline with `defineProps<{}>()` and destructure directly (Vue 3.5+) — defaults go in the destructuring assignment
- Use `withDefaults` only when the inline type gets unwieldy or you need to reference `props` as an object
- Prefer descriptive naming over JSDocs comments for props
- Use typed `defineEmits` signatures

```vue
<script setup lang="ts">
// preferred — destructuring with defaults
const {
	/** Description of what this prop does */
	label,
	/** Whether the component is disabled */
	disabled = false,
} = defineProps<{
	label?: string;
	disabled?: boolean;
}>();

// use withDefaults when you need props as a reactive object
const props = withDefaults(defineProps<{ label?: string; disabled?: boolean }>(), {
	disabled: false,
});

const emit = defineEmits<{
	click: [event: MouseEvent];
}>();
</script>
```

### Template

- PascalCase for component names: `<MyComponent />` not `<my-component />` (enforced by ESLint)
- Shorthand attributes: `:prop`, `@event`, `#slot`
- **Always check `src/components/` before writing plain HTML or creating a new component.** Consult `src/components/register.ts` for the full list of globally registered components — no import needed in templates.

### File naming

- Components: Prefer PascalCase for component file names: `MyComponent.vue` not `my-component.vue`
- Path alias: `@/` resolves to `src/` — use it for all cross-directory imports

## Styling

- Always use `<style lang="scss">`
- Use CSS custom properties for theming, following the `--component-name-property` pattern:

```vue
<style lang="scss">
.my-component {
	--my-component-color: var(--theme--foreground);

	color: var(--my-component-color);
}
</style>
```

- **CSS logical properties are required** (enforced by Stylelint `csstools/use-logical`):
  - `inline-size` / `block-size` instead of `width` / `height`
  - `inset-inline-start` / `inset-inline-end` instead of `left` / `right`
  - `inset-block-start` / `inset-block-end` instead of `top` / `bottom`
  - `padding-inline` / `margin-block` instead of directional shorthands
- Theme design tokens available via `var(--theme--*)` (e.g. `--theme--primary`, `--theme--foreground`,
  `--theme--background`)

## Composables

- Named export, `use*` prefix: `export function useMyFeature() {}`
- File naming: `use-my-feature.ts` in `src/composables/`
- Return a plain object
- **Check VueUse before writing custom reactive logic.** `@vueuse/core`, `@vueuse/integrations`, and `@vueuse/router`
  are available. Common cases that VueUse already covers:
  - Event listeners → `useEventListener`
  - `window`/`document` size or scroll → `useWindowSize`, `useScroll`, `useIntersectionObserver`
  - Keyboard shortcuts → `useKeyModifier`, `onKeyStroke`
  - Clipboard → `useClipboard`
  - Local/session storage → `useLocalStorage`, `useSessionStorage`
  - Debounce / throttle → `useDebounceFn`, `useThrottleFn`
  - Fetch / async state → `useFetch`, `useAsyncState`
  - Media queries → `useMediaQuery`
  - Element visibility → `useElementVisibility`
  - Mouse position → `useMouse`
  - `ResizeObserver` → `useResizeObserver`
  - `MutationObserver` → `useMutationObserver`
  - Router params/query (typed) → `@vueuse/router`
- **A composable must use Vue's reactivity system** — it should own reactive state (`ref`, `reactive`, `computed`) or
  call another composable/store that does. If a function has no reactive state and no lifecycle hooks, it's a utility
  function and belongs in `src/utils/` instead.

```ts
// composable — owns reactive state
export function useMyFeature() {
	const state = ref(null);
	const derived = computed(() => state.value?.name);
	return { state, derived, doSomething };

	function doSomething() {
		/* ... */
	}
}

// NOT a composable — pure logic, no reactivity → put in src/utils/
export function formatMyValue(value: string): string {
	return value.trim().toLowerCase();
}
```

## Stores (Pinia)

- Use Setup Store style (function-based) over Options style
- Named export: `export const useMyStore = defineStore('myStore', () => { ... })`
- Store ID in camelCase with `Store` suffix: `'userStore'`
- File naming: `kebab-case.ts` in `src/stores/`

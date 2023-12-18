---
description: Learn how to use the Directus UI components in your app extensions.
contributors: Esther Agbaje
---

# Using Directus UI Components

Directus provides a set of reusable UI components that can be used in when building extensions. These components are
designed to provide a consistent user experience across different projects and extensions.

## Components Playground

Explore the available components on the [Histoire Components Playground](https://components.directus.io/). Here, you can
interact with different components and experiment with variations before implementing them in your project.

![Directus UI Components](https://marketing.directus.app/assets/46d72f1a-5d9f-49f8-a09a-b2ffc5200812.gif)

## Usage within Extensions

Directus UI components are globally registered, making them accessible throughout your extension project without the
need for explicit imports. Here’s a basic example:

```tsx
<VButton>
  My Button
</VButton>
```

## Customizing Styles

Each component exports CSS custom properties (variables) that can be targeted for style overrides.

For example, to adjust the text color of a button on hover:

```tsx
// give the button a class
<VButton class="my-button">
  My Button
</VButton>

// customize the style
.my-button {
  --v-button-color-hover: black;
}
```

::: tip Explore CSS Variables

Refer to the full list of component based CSS variables in our codebase
[in our codebase](https://github.com/directus/directus/tree/main/app/src/components).

:::

## Creating a Custom UI Component

The Directus UI components are designed with flexibility and customization in mind, enabling you to build your custom UI
components.

We exposes a couple of CSS variables for both light and dark themes. These variables are useful when building a custom
component and want it to look native to Directus.

Here are some examples of CSS variables: `--border-normal`, `--foreground-normal` `-purple`, `--module-background`, and
`--overlay-color`.

::: tip Explore Light and Dark Theme CSS Variables

Refer to our [codebase](https://github.com/directus/directus/tree/main/app/src/styles/themes) for a full list of CSS
variables.

:::

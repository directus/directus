# Mini-App Components Overview

This is a brief overview of all available components. Use `describe_component` action for detailed documentation.

## Layout Components

| Component         | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `v-card`          | Container with optional shadow and border radius     |
| `v-card-title`    | Title section for v-card                             |
| `v-card-subtitle` | Subtitle section for v-card                          |
| `v-card-text`     | Text/content section for v-card                      |
| `v-card-actions`  | Actions/buttons section for v-card                   |
| `v-sheet`         | Simple container with background                     |
| `v-divider`       | Horizontal or vertical divider line                  |
| `v-detail`        | **Collapsible section** - use for expandable content |
| `v-overlay`       | Full-screen or absolute positioned overlay           |

## Input Components

| Component    | Description                                                                     | Key Props                                       |
| ------------ | ------------------------------------------------------------------------------- | ----------------------------------------------- |
| `v-input`    | Text input field                                                                | `modelValue`, `type`, `placeholder`, `disabled` |
| `v-textarea` | Multi-line text input                                                           | `modelValue`, `placeholder`, `disabled`         |
| `v-select`   | **Dropdown select** - needs `items` array. Use `describe_component` for details | `items`, `modelValue`, `placeholder`            |
| `v-checkbox` | Checkbox input                                                                  | `modelValue`, `label`, `disabled`               |
| `v-radio`    | Radio button input                                                              | `modelValue`, `value`, `label`                  |
| `v-slider`   | Range slider                                                                    | `modelValue`, `min`, `max`, `step`              |

## Display Components

| Component     | Description                        | Key Props                                             |
| ------------- | ---------------------------------- | ----------------------------------------------------- |
| `v-button`    | Clickable button                   | `onClick`, `disabled`, `loading`, `secondary`, `kind` |
| `v-icon`      | Material icon display              | `name` (e.g., "check", "close", "add")                |
| `v-avatar`    | Circular/square avatar container   | `xSmall`, `small`, `large`, `xLarge`, `tile`          |
| `v-badge`     | Badge/counter overlay              | `value`, `dot`, `icon`                                |
| `v-chip`      | Tag/chip element                   | `label`, `close`, `outlined`, `active`                |
| `v-notice`    | Alert/notice box                   | `type` ("info", "success", "warning", "danger")       |
| `v-info`      | Information display with icon      | `type`, `title`, `icon`, `center`                     |
| `v-image`     | Image display                      | `src`, `alt`                                          |
| `v-highlight` | Text with highlighted search match | `query`, `text`                                       |

## List Components

| Component             | Description                                                                        |
| --------------------- | ---------------------------------------------------------------------------------- |
| `v-list`              | Container for list items                                                           |
| `v-list-item`         | Single list item (clickable)                                                       |
| `v-list-item-icon`    | Icon slot for list item                                                            |
| `v-list-item-content` | Content slot for list item                                                         |
| `v-list-item-hint`    | Hint/secondary text for list item                                                  |
| `v-list-group`        | Expandable group of list items                                                     |
| `v-table`             | **Data table** - needs `headers` and `items`. Use `describe_component` for details |

## Navigation Components

| Component      | Description                                                                       |
| -------------- | --------------------------------------------------------------------------------- | -------------------------------------- |
| `v-tabs`       | **Tab container** - use with v-tab children. Use `describe_component` for details |
| `v-tab`        | Individual tab button                                                             |
| `v-tabs-items` | Container for tab content panels                                                  |
| `v-tab-item`   | Individual tab content panel                                                      |
| `v-pagination` | Page navigation                                                                   | `modelValue`, `length`, `totalVisible` |
| `v-breadcrumb` | Breadcrumb navigation                                                             | `items` array                          |

## Feedback Components

| Component             | Description                        | Key Props                 |
| --------------------- | ---------------------------------- | ------------------------- |
| `v-progress-linear`   | Horizontal progress bar            | `value`, `indeterminate`  |
| `v-progress-circular` | Circular spinner/progress          | `value`, `indeterminate`  |
| `v-skeleton-loader`   | Loading placeholder                | `type`                    |
| `v-text-overflow`     | Text with ellipsis overflow        | `text`                    |
| `v-hover`             | Hover state provider (scoped slot) | `openDelay`, `closeDelay` |
| `v-error`             | Error display                      |                           |
| `v-error-boundary`    | Error boundary wrapper             |                           |

## HTML Elements

All standard HTML elements: `div`, `span`, `p`, `h1`-`h6`, `ul`, `ol`, `li`, `a`, `img`, `br`, `hr`, `strong`, `em`,
`code`, `pre`

## Advanced Components

| Component | Description                                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| `v-form`  | **Dynamic form renderer** - renders forms from field schemas. Complex component, use `describe_component` for details |

## Components Requiring Detailed Documentation

These components have complex props or patterns. Call `describe_component` for full documentation:

- **v-select** - Dropdown with items array configuration
- **v-tabs** - Tab navigation with parent-child pattern
- **v-table** - Data table with headers and items
- **v-detail** - Collapsible sections
- **v-list-group** - Expandable list groups
- **v-form** - Dynamic form renderer (advanced, Tier 4)

## Best Practices

### Always Initialize State Before Use

Components will warn or fail if they receive `null` or `undefined` for required props. Always initialize state values:

```javascript
// Good - initialize all state values
state.imageUrl = '';
state.items = [];
state.activeTab = ['home'];  // v-tabs expects Array
state.loading = true;

// Bad - using undefined state
state.imageUrl;  // undefined - will cause warnings
```

### Use `condition` for Async-Dependent Components

When a component depends on data loaded asynchronously (e.g., from `actions.init`), use `condition` to prevent rendering until data is available:

```json
{
  "type": "v-image",
  "condition": "state.imageUrl",
  "props": { "src": "state.imageUrl" }
}
```

```json
{
  "type": "v-list",
  "condition": "state.items.length",
  "children": [...]
}
```

### Component-Specific Requirements

| Component  | Requirement                                                                   |
| ---------- | ----------------------------------------------------------------------------- |
| `v-tabs`   | `modelValue` must be an **Array**: `state.activeTab = ['home']`               |
| `v-image`  | `src` is required - use `condition` if loading async                          |
| `v-select` | `items` array required: `[{ text: 'Label', value: 'val' }]`                   |
| `v-table`  | Both `headers` and `items` arrays required                                    |
| Iteration  | Initialize array state before use: `state.items = []`                         |

### Pattern: Loading States

Show loading feedback while fetching async data:

```json
{
  "type": "div",
  "children": [
    {
      "type": "v-progress-circular",
      "condition": "state.loading",
      "props": { "indeterminate": true }
    },
    {
      "type": "div",
      "condition": "!state.loading",
      "children": [...]
    }
  ]
}
```

```javascript
state.loading = true;
state.data = null;

actions.init = async () => {
  state.data = await readItems('collection');
  state.loading = false;
};
```

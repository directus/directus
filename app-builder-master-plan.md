# Directus Minis - Implementation Guide

## Overview

Directus Minis is a core Directus module that allows users (via AI or manual editing) to create small, self-contained
**mini-apps** rendered within the Directus interface. These mini-apps are stored in the `directus_minis` collection and
rendered dynamically by a single module shell.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Directus App                            │
├─────────────────────────────────────────────────────────────┤
│  app/src/modules/minis/                                     │
│  ├── index.ts              # Module registration            │
│  ├── routes/                                                │
│  │   ├── overview.vue      # List all minis                 │
│  │   └── shell.vue         # Run a single mini-app          │
│  ├── components/                                            │
│  │   ├── app-navigation.vue    # Sidebar navigation         │
│  │   ├── app-sandbox.ts        # Sandbox factory            │
│  │   └── schema-renderer.vue   # UI schema → Vue components │
│  ├── composables/                                           │
│  │   └── use-minis.ts          # Data fetching              │
│  └── services/                                              │
│      ├── quickjs-sandbox.ts    # QuickJS/WASM execution     │
│      └── safe-sdk.ts           # Secure SDK wrapper         │
├─────────────────────────────────────────────────────────────┤
│  api/src/ai/tools/minis/                                    │
│  ├── index.ts              # AI tool for CRUD operations    │
│  ├── prompt.md             # AI instructions                │
│  └── components/                                            │
│      ├── overview.md       # Component overview             │
│      └── docs/             # Detailed component docs        │
│          ├── v-select.md                                    │
│          ├── v-tabs.md                                      │
│          └── ...           # 27 component doc files         │
├─────────────────────────────────────────────────────────────┤
│  api/src/database/migrations/                               │
│  ├── 20251221A-add-minis.ts  # Creates collection           │
└─────────────────────────────────────────────────────────────┘
```

## Data Model

The `directus_minis` collection stores mini-app definitions (API endpoint: `/minis`).

| Field                 | Type      | Description                                                                                             |
| --------------------- | --------- | ------------------------------------------------------------------------------------------------------- |
| `id`                  | uuid      | Primary key                                                                                             |
| `name`                | string    | Display name (required)                                                                                 |
| `icon`                | string    | Material Symbols icon name                                                                              |
| `description`         | text      | Brief description                                                                                       |
| `status`              | string    | 'draft' or 'published'                                                                                  |
| `ui_schema`           | json/text | JSON UI layout.                                                                                         |
| `panel_config_schema` | json      | Definition of configuration fields for the mini-app when used in a panel. Use `VForm` schema structure. |
| `css`                 | text      | Scoped CSS styles.                                                                                      |
| `script`              | text      | JavaScript code.                                                                                        |
| `date_created`        | timestamp | Auto-generated                                                                                          |
| `date_updated`        | timestamp | Auto-generated                                                                                          |
| `user_created`        | uuid      | Auto-generated                                                                                          |
| `user_updated`        | uuid      | Auto-generated                                                                                          |

## Sandbox Implementation

### QuickJS/WASM (Lightweight)

The sandbox uses QuickJS compiled to WebAssembly for isolation.

**Key features:**

- **Singleton module loading** - QuickJS WASM loads once and is reused across mini-apps
- **JSON state sync** - State is serialized/deserialized via JSON after each action.
- **Fire-and-forget init** - `actions.init()` is called without blocking

**How it works:**

1. Load QuickJS WASM module
2. Create context
3. Set up `state`, `actions`, `console`, and `sdk` (SafeSDK)
4. Execute user `script`

**Available namespaces in sandbox:**

- **`sdk`** (Core SDK):
  - `readItems(collection, query)`
  - `readItem(collection, id, query)`
  - `createItem(collection, data)`
  - `updateItem(collection, id, data)`
  - `deleteItem(collection, id)`
  - `request(path, options)`
  - **`config`**: Object containing values from the panel instance configuration (based on `panel_config_schema`).

- **`dashboard`** (Dashboard Interop):
  - `getVariable(name)`: Read a dashboard-wide variable. Returns the current value of the variable.
  - `setVariable(name, value)`: Set a dashboard-wide variable. This value is reactive across other panels.

**Timer functions:**

- `setTimeout(callback, delay)`
- `clearTimeout(timerId)`
- `setInterval(callback, interval)`
- `clearInterval(timerId)`

**Timer limitations:**

- Maximum 50 concurrent timers per mini-app
- Minimum interval of 50ms (shorter intervals are clamped)
- All timers are automatically cleared when the mini-app is disposed
- State is synced after each timer callback executes

### Verbose Diagnostics

The sandbox and UI are optimized for developer transparency:

- **Stack Traces**: All runtime and initialization errors capture and display full stack traces from the QuickJS
  environment.
- **SDK Detail**: Errors from `readItems`, `request`, etc., preserve original Axios/SDK diagnostics (including status
  codes and server messages).
- **Console Capture**: `console.log/warn/error` messages are captured with timestamps and can be viewed via the
  `debug-mini-app` tool or the "Logs" section in the UI.

### Safe SDK

The `SafeSDK` wrapper ensures mini-apps can only make requests within the Directus instance.

All requests go through the authenticated user's session and respect permissions.

### Layout & Theming

- **Assumption**: 800px standard content width. Layouts must be flexible (100% width).
- **Semantic Props**: Use `kind="primary|success|danger|warning|info"` for buttons and chips.
- **Theme Variables**: Use `--theme--*` variables for all custom CSS colors and spacing.

## Schema Renderer

### Why JSON Schema?

The UI is defined in a strict JSON format (not HTML or Vue code) for security and stability:

1.  **Security**: A whitelist of allowed components (`type`) prevents malicious code execution or access to internal
    system components.
2.  **Stability**: The schema is data, not code. It is rendered by a dedicated engine that safely handles bindings and
    events.
3.  **Sanitized**: No direct DOM access or `v-html` reduces XSS risks.
4.  **Flexible Rendering**: Supports **Named Slots** (providing an Object for `children`) to allow components like
    `v-table`, `v-list-item`, and `v-card` to render custom, richer content in specific areas (e.g. custom table cells).

### Current Implementation

The `schema-renderer.vue` component converts JSON UI schemas to Vue components.

### Supported Components

**Directus Components:**

- Layout: `v-card`, `v-card-title`, `v-card-subtitle`, `v-card-text`, `v-card-actions`, `v-sheet`, `v-divider`,
  `v-detail`, `v-overlay`
- Input: `v-input`, `v-textarea`, `v-select`, `v-checkbox`, `v-radio`, `v-slider`
- Display: `v-button`, `v-icon`, `v-avatar`, `v-badge`, `v-chip`, `v-notice`, `v-info`, `v-image`, `v-highlight`
- Lists: `v-list`, `v-list-item`, `v-list-item-icon`, `v-list-item-content`, `v-list-item-hint`, `v-list-group`,
  `v-table`
- Navigation: `v-tabs`, `v-tab`, `v-tabs-items`, `v-tab-item`, `v-pagination`, `v-breadcrumb`
- Feedback: `v-progress-linear`, `v-progress-circular`, `v-skeleton-loader`, `v-text-overflow`, `v-hover`, `v-error`,
  `v-error-boundary`
- Advanced: `v-form` (dynamic form renderer - complex, use `describe_component` for details)

**HTML Elements:**

- `div`, `span`, `p`, `h1`-`h6`, `ul`, `ol`, `li`, `a`, `img`, `br`, `hr`, `strong`, `em`, `code`, `pre`

**Component Documentation:**

For complex components (`v-select`, `v-tabs`, `v-table`, etc.), use the minis tool's documentation actions:

- `{ "action": "list_components" }` - Get overview of all components
- `{ "action": "describe_component", "component": "v-select" }` - Get detailed docs for specific component

### Binding Syntax

```json
{
	"type": "div",
	"props": { "class": "container" },
	"children": [
		{
			"type": "p",
			"children": ["Count: {{ state.count }}"]
		},
		{
			"type": "v-button",
			"props": { "onClick": "actions.increment" },
			"children": ["Add"]
		}
	]
}
```

- `{{ state.property }}` - Text interpolation
- `state.property` - Direct prop binding
- `actions.method` - Action binding (**BEST PRACTICE**: The Mini-App renderer forwards all event arguments
  automatically. Use this for inputs and selects.)
- `actions.method(item.id)` - Action with context arguments (**CAUTION**: Using parentheses prevents automatic
  forwarding of event arguments. Use this only for static context like IDs.)

### Control Flow

#### Conditionals (`v-if`)

Use `"condition": "state.propertyName"` to conditionally render a node.

**IMPORTANT CONSTRIANTS**: Conditions do **NOT** support complex JavaScript expressions (e.g., `state.count > 0` or
`state.a && state.b`). They ONLY support:

1.  **Truthiness**: `"condition": "state.isVisible"` (Show if truthy)
2.  **Negation**: `"condition": "!state.isLoading"` (Show if falsy)
3.  **Path Access**: `"condition": "state.user.isAdmin"`

**Pattern to follow:** Calculate boolean logic in `script` and use a simple state variable in `schema`.

**❌ BAD:**

```json
{ "type": "div", "condition": "state.items.length > 0", "children": ["Has items"] }
```

**✅ GOOD:** **Script**:

```javascript
// Update this whenever items change
state.hasItems = state.items.length > 0;
```

**Schema**:

```json
{ "type": "div", "condition": "state.hasItems", "children": ["Has items"] }
```

#### Iteration (`v-for`)

Use `"iterate": "state.arrayPath"` to render a list of items. The node _containing_ the `iterate` property is a
**Virtual Container**. It does NOT render itself. Instead, it renders the `template` for _each_ item in the array.

**Properties:**

- `iterate`: Path to the array in state (e.g., "state.posts")
- `template`: The node structure to replicate for each item.
- `as`: (Optional) Variable name for the current item (default: "item").
- `index`: (Automatic) Variables `index` is available in scope.

**Example 1: List Items (Standard)**

```json
{
	"type": "v-list",
	"children": [
		{
			"type": "template",
			"iterate": "state.users",
			"as": "user",
			"template": {
				"type": "v-list-item",
				"children": ["{{ index }}: {{ user.name }}"]
			}
		}
	]
}
```

**Example 2: Divs & Cards (Any Tag Works)** Iteration is NOT limited to lists. You can repeat `div`, `v-card`, or any
other component.

```json
{
	"type": "div",
	"props": { "class": "grid-layout" },
	"children": [
		{
			"type": "template",
			"iterate": "state.products",
			"as": "product",
			"template": {
				"type": "v-card",
				"props": { "class": "product-card" },
				"children": [
					{ "type": "v-card-title", "children": ["{{ product.title }}"] },
					{ "type": "v-card-text", "children": ["Price: ${{ product.price }}"] }
				]
			}
		}
	]
}
```

### Input Binding

### Input Binding (CRITICAL)

Inputs (like `v-input`, `v-checkbox`, `v-select`) do **NOT** support `v-model`. You MUST strictly separate the value
binding and the update event.

**❌ INCORRECT (Do NOT do this):**

```json
{
	"type": "v-input",
	"props": { "v-model": "state.myValue" }
}
```

**✅ CORRECT:**

```json
{
	"type": "v-input",
	"props": {
		"modelValue": "state.myValue",
		"onUpdate:modelValue": "actions.updateValue"
	}
}
```

**Corresponding Script:**

```javascript
// 1. Initialize state
state.myValue = '';

// 2. Define update action (receives the new value automatically)
actions.updateValue = (val) => {
	state.myValue = val;
};
```

### Best Practices (Do's and Don'ts)

| Do ✅                                                          | Don't ❌                                      |
| :------------------------------------------------------------- | :-------------------------------------------- |
| Use `modelValue` + `onUpdate:modelValue`                       | Use `v-model`                                 |
| Use `actions.handleClick` (no args) or `actions.handle('arg')` | Write inline JS in props like `() => ...`     |
| Initialize all `state` variables in `script`                   | access undefined state variables              |
| Use `v-list` with `iterate` for loops                          | Try to use `v-for` inside the props           |
| Stick to the allowed component list                            | Try to use random HTML tags or Vue components |

## CSS Scoping

CSS is automatically scoped to the mini-app container:

```css
/* Input */
.my-class {
	color: red;
}

/* Output (auto-scoped) */
.mini-app-container[data-app-id='uuid'] .my-class {
	color: red;
}
```

## AI Tool Integration

The `minis` tool is registered in `api/src/ai/tools/index.ts`.

### Tool Actions

| Action               | Required              | Description                                         |
| -------------------- | --------------------- | --------------------------------------------------- |
| `create`             | `data` (with `name`)  | Create new mini-app(s)                              |
| `read`               | -                     | List all mini-apps or get specific ones by ID       |
| `update`             | `keys` OR `data[].id` | Modify existing mini-app(s)                         |
| `delete`             | `keys`                | Remove mini-app(s) by ID                            |
| `validate`           | `keys` OR `data`      | Check ui_schema/script consistency before save      |
| `list_components`    | -                     | Get overview of all available UI components         |
| `describe_component` | `component`           | Get detailed documentation for a specific component |

### Local Frontend Tools

**IMPORTANT**: When a user is viewing a mini-app in the shell, **local frontend tools** become available. These tools:

- **Automatically know the current mini-app** - NO need to ask for or provide an ID
- Operate in-memory with no database calls
- Show the current mini-app name and ID in their descriptions

**When to use local tools vs backend `minis` tool:**

- User is **viewing a mini-app** and asks to fix/debug/edit it → Use LOCAL tools (`debug-mini-app`,
  `test-mini-app-changes`, etc.)
- User wants to create a **new** mini-app or edit one they're **not viewing** → Use BACKEND `minis` tool with
  `create`/`update` action

**Permission-based availability:**

- `debug-mini-app`: Available to ALL users (read-only diagnostics)
- `test-mini-app-changes`: Requires edit permission
- `reset-mini-app`: Requires edit permission
- `save-mini-app-changes`: Requires edit permission

#### `debug-mini-app`

Returns diagnostic info from the running sandbox:

- `miniApp`: Basic info (id, name, status)
- `editMode`: Whether user is in edit mode
- `testingMode`: Whether currently testing unsaved changes
- `canEdit`: Whether user has edit permission
- `initError`: Script initialization error (if any)
- `runtimeErrors`: Errors from action calls (with action name and timestamp)
- `recentLogs`: Last 20 console.log/warn/error messages
- `currentState`: Live state values
- `availableActions`: List of defined actions

#### `test-mini-app-changes`

Test changes without saving (requires edit permission):

```json
{
  "ui_schema": { ... },  // optional - new UI schema to test
  "script": "...",       // optional - new script to test
  "css": "..."           // optional - new CSS to test
}
```

Returns debug info after applying changes. The user is automatically placed in **edit mode** with a "Testing unsaved
changes" banner and can toggle between live preview and form view.

#### `reset-mini-app`

Discard test changes and restore the saved version. Exits edit mode.

#### `save-mini-app-changes`

Save the currently tested changes to the database. Only works after `test-mini-app-changes` has been called.

**STRICT INTERACTION POLICY**:

- **NEVER** call `save-mini-app-changes` unless the user explicitly asks to "save" or "persist".
- ALWAYS use `debug-mini-app` first to see the `activeSchema`, `activeScript`, and `activeCss`. These include any
  unsaved manual edits the user has made. You MUST incorporate these manual changes into your work to avoid overwriting
  the user.

**Recommended workflow:**

1. User reports issue → call `debug-mini-app` to see errors
2. Identify fix → call `test-mini-app-changes` with corrected code
3. Verify fix works → call `debug-mini-app` again to confirm no errors
4. **Save changes** → call `save-mini-app-changes` to persist **ONLY if the user explicitly asks to "save" or
   "persist"**.

### Edit Mode UX

When a user or AI enters edit mode, the UI changes:

**Title**: Shows "Editing [App Name] Mini-App" (e.g., "Editing Calculator Mini-App")

**Header Actions** (in edit mode):

- **Preview toggle** (play_arrow/code icon): Switch between Form view and Live Preview
- **Cancel** (X icon): Discard changes and exit edit mode
- **Save** (checkmark icon): Save changes (disabled if no changes)

**Content Area**:

- **Form view** (`livePreview=false`): Shows the VForm for editing fields
- **Live Preview** (`livePreview=true`): Shows the mini-app running with current changes

**Banners**:

- "Testing unsaved changes" - When AI called `test-mini-app-changes`
- "Previewing local changes" - When user is previewing form edits (not AI testing)

**Mode Initialization**: | Entry Point | Starts With | |-------------|-------------| | User clicks Edit button | Form
view | | AI calls `test-mini-app-changes` | Live Preview |

### Efficiency Tips

- **Batch creates**: Pass an array to `data` to create multiple mini-apps at once
- **Batch updates**: Pass `data` as an array with each item containing its `id` to update multiple mini-apps differently
- **Same update to many**: Use `keys: ['id1', 'id2']` with a single `data` object to apply the same changes to multiple
  mini-apps
- **Single call for all changes**: When modifying a mini-app, include ALL changes (`ui_schema`, `script`, `css`, `name`,
  etc.) in one update call rather than making multiple separate calls.
- **Error Handling**: Always use `try/catch` for SDK calls and display errors in the UI.
- **State Limits**: Remember that `state` is JSON serialized; avoid storing non-POJO data.
- **CSS Mastery**: Assign `id` or `class` props to your components in the `ui_schema` to target them easily with custom
  CSS. Call `list-theme-variables` to get active theme values.

## 💎 Premium Quality Checklist (REQUIRED)

Every mini-app MUST follow these standards by default:

1.  **Aesthetics**: Use Directus theme variables (e.g., `--theme--primary`, `--theme--background-normal`) for a native
    look.
2.  **Layout**: Assume **800px** width but ensure containers take **100% of available width**.
3.  **Visual Polish**: Use gradients, shadows, and micro-animations. Avoid plain CSS colors.
    - `box-shadow: 0 4px 12px var(--theme--shadow-color);`
    - `padding: 20px;` (Standard spacing)
4.  **Interactive States**: Buttons MUST show `:loading="state.loading"` or similar feedback during async operations.
5.  **Error Handling**: Use `v-notice type="danger"` to display errors from `try/catch` blocks in SDK calls.
6.  **V-Table Mastery**: For data-heavy views, use `v-table` with custom headers and row templates.
7.  **Dashboard Interop**: If the app calculates a value (like "Total Stock"), use `dashboard.setVariable` to sync it.
8.  **Mandatory Configuration**: Any dashboard variable name (used in `get/setVariable`), collection name, target email,
    or item limit MUST be defined in `panel_config_schema` and accessed via `sdk.config`.
    - **CRITICAL**: You MUST provide a `schema.default_value` for every field (e.g., `"default_value": "total_stock"`).
      This ensures the script never receives `undefined` and prevents runtime crashes.
    - **Script Fallbacks**: Always include a JS fallback: `const varName = sdk.config.var || 'default_var'`.
    - **Consistency Rule**: The JS fallback value MUST match the `meta.options.placeholder` value.
    - **Placeholders**: Use `meta.options.placeholder` to guide the user (e.g., `'default_var'`).
    - **Type Safety**: Always cast to String when syncing to text panels: `dashboard.setVariable(name, String(val))`.

> [!WARNING] **Avoid Reactivity Loops**: Setting dashboard variables can trigger a re-render of all panels. Avoid
> calling `setVariable` in `actions.init` or high-frequency paths if it depends on dashboard context, as this can create
> an infinite fetch loop. Always check if the value has actually changed before setting it.

## 🍱 Advanced Pattern: Data Table with Interop

**ui_schema:**

```json
{
	"type": "v-card",
	"children": [
		{
			"type": "v-card-title",
			"children": ["Inventory Management"]
		},
		{
			"type": "v-table",
			"props": {
				"items": "state.items",
				"loading": "state.loading",
				"showResize": true,
				"headers": [
					{ "text": "Name", "value": "name" },
					{ "text": "Stock", "value": "stock" },
					{ "text": "Status", "value": "status", "align": "center" }
				]
			},
			"children": {
				"item.status": {
					"type": "v-chip",
					"props": {
						"kind": "success",
						"small": true,
						"label": true
					},
					"children": ["{{ item.status }}"]
				}
			}
		},
		{
			"type": "v-notice",
			"condition": "state.error",
			"props": { "type": "danger" },
			"children": ["{{ state.error }}"]
		}
	]
}
```

**script:**

```javascript
state.items = [];
state.loading = false;
state.error = null;

actions.init = async () => {
	actions.load();
};

actions.load = async () => {
	state.loading = true;
	state.error = null;
	try {
		const data = await readItems('inventory');
		state.items = data;

		// Update global dashboard total
		const total = data.reduce((acc, i) => acc + i.stock, 0);
		dashboard.setVariable('total_inventory_count', total);
	} catch (err) {
		state.error = err.message;
	} finally {
		state.loading = false;
	}
};
```

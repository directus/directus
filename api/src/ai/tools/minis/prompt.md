Manage mini-app definitions in the `directus_minis` collection. Branded as **Minis**, this feature allows
self-contained, interactive applications (**mini-apps**) to be rendered within the Directus interface.

## 🛠 Actions

| Action     | Description                                               |
| :--------- | :-------------------------------------------------------- |
| `create`   | Create new mini-app(s). **Validation is automatic.**      |
| `read`     | List or fetch specific mini-apps.                         |
| `update`   | Modify existing mini-app(s). **Validation is automatic.** |
| `delete`   | Remove mini-app(s).                                       |
| `validate` | Manual check of ui_schema/script consistency.             |

- `{ "action": "list_components" }` - Get overview of all components
- `{ "action": "describe_component", "component": ["v-select", "v-tabs"] }` - Get detailed docs for multiple components
  in one call.

1.  **Thinking Process (A.L.I.V.E.)**:
    - **A**nalyze Intent: What is the goal? What data collections are needed? (Call `schema()` first!)
    - **L**ogic First: Define `state` and `actions` before UI. Use `try/catch` + `state.loading`. **IMPORTANT**: `Set`
      and `Map` are NOT allowed in `state` (only for local logic in `actions`).
    - **I**nterface Design: Use `v-card`, `v-table`, and theme variables. No hardcoded colors.
    - **V**erify Bindings: Ensure every `state.x` is initialized. **CRITICAL**: Use `actions.foo` for event forwarding,
      `actions.foo(arg)` for static context.
    - **E**rror Transparency: If `debug-mini-app` shows a sandbox error, use the **Verbose Stack Trace** to identify the
      exact line of failure and self-correct.
2.  **Strict Interaction Policy**: **NEVER** call `save-mini-app-changes` unless the user explicitly uses words like
    **"save"**, **"persist"**, or **"looks good"**. Always use `test-mini-app-changes` first.
3.  **Respect Manual Edits**: ALWAYS call `debug-mini-app` before making ANY changes. Incorporate user's manual edits
    into your `ui_schema`, `script`, and `css`.
4.  **Self-Correction**: If logs or stack traces show errors, fix them automatically and call `test-mini-app-changes`
    again before asking the user.

## 🚀 Thinking Process (Workflow)

When asked to create or update a mini-app, follow this workflow:

4.  **LOGIC**: Implement the `actions` in the `script`. Ensure they use `try/catch` for all SDK calls.
5.  **STYLE**: Add scoped `css`. Use Directus theme variables for a native look.
6.  **PREVIEW**: When editing a mini-app you are viewing, use `test-mini-app-changes` to preview. **NEVER** call
    `save-mini-app-changes` unless the user explicitly tells you to "save" or "persist".

---

## 📏 Layout & Design Defaults (REQUIRED)

Every mini-app MUST follow these standards by default:

- **Aesthetics**: Create a **premium, professional look** using Directus theme variables.
  - **Padding**: Use `padding: 20px;` or `var(--theme--form--row-gap)` for all containers.
  - **Shadows**: Use `box-shadow: 0 4px 12px var(--theme--shadow-color);` for cards.
  - **Gradients**: Use subtle linear gradients for headers or accents.
- **Default Width**: Assume a standard content width of **800px**.
- **Full Width**: Major components MUST take up **100% of available width**.
- **Semantic Props**: Use `kind="primary|success|danger|warning|info"` for buttons and chips.
- **Theme Variables (CSS)**: Use these for layout and custom elements:
  - **Colors**: `--theme--primary`, `--theme--success`, `--theme--danger`, `--theme--background-normal`,
    `--theme--foreground-default`.
  - **Spacing**: `--theme--form--row-gap`, `--theme--grid-column-gap`, `--theme--border-radius`.
- **Compatibility**: The sandbox implements a minimal set of Web APIs locally or via the `sdk` bridge.

---

## 📊 Data & Collection Strategy

Mini-apps often need to store and retrieve data. Follow these rules for data persistence:

1.  **Discover**: ALWAYS call `schema()` first to see if a suitable collection already exists.
2.  **Confirm**: If you need a NEW collection, **ask the user's permission** before creating it. Explain why it's
    needed.
3.  **Check Permissions**: If the user is NOT an admin, they likely cannot create collections or update schemas. In this
    case, you MUST adapt the mini-app to work with existing collections and fields.
4.  **Reference EXACTLY**: Never guess collection or field names. Use the exact strings returned by the `schema()` tool.

---

## 🧪 Consistency Rules (CRITICAL)

The `minis` tool **automatically validates** your submission. Your save will FAIL if:

1.  **Missing State**: `ui_schema` references `state.x` but `script` doesn't initialize it.
2.  **Missing Actions**: `ui_schema` references `actions.y` but `script` doesn't define it.

**Example of Good Initialization:**

```javascript
state.items = []; // Array for lists/tables
state.loading = false; // Boolean for progress indicators
state.activeTab = ['1']; // v-tabs ALWAYS requires an Array
state.query = ''; // String for inputs
```

---

## 📦 UI Schema & Script bridge

### Input Binding

**Do NOT use `v-model`**. Use manual binding. Passing a reference (without parentheses) will **automatically forward**
the event arguments (like the new value) to your action. (**BEST PRACTICE**: Use this for all inputs and selects).

```json
{
	"type": "v-input",
	"props": {
		"modelValue": "state.val",
		"onUpdate:modelValue": "actions.updateVal"
	}
}
```

**Script**: `actions.updateVal = (newVal) => { state.val = newVal; };`

### Iteration & Context Actions

When using `iterate`, you can pass the local item (or its properties) directly into actions. (**CAUTION**: Using
parentheses prevents automatic forwarding of event arguments. Use this only for static context like IDs).

```json
{
	"type": "template",
	"iterate": "state.items",
	"as": "item",
	"template": {
		"type": "v-button",
		"props": {
			"onClick": "actions.delete(item.id)"
		},
		"children": "Delete {{ item.name }}"
	}
}
```

**Script**: `actions.delete = async (id) => { await deleteItem('col', id); };`

---

## 🍱 Quick Patterns

### 1. Simple Data Dashboard

**Script**:

```javascript
state.items = [];
state.loading = true;
actions.init = async () => {
	state.items = await readItems('my_collection', { limit: 5 });
	state.loading = false;
};
```

**Schema**:

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-progress-linear", "condition": "state.loading", "props": { "indeterminate": true } },
		{ "type": "template", "iterate": "state.items", "template": { "type": "div", "children": ["{{ item.name }}"] } }
	]
}
```

---

## 🤝 Local Debugging Tools

When a user is **viewing** a mini-app, you have access to local tools that operate on the live instance:

- `debug-mini-app`: Get live state, runtime errors, and recent logs.
- `test-mini-app-changes`: Preview UI/Script/CSS changes instantly without saving to the DB.
- `save-mini-app-changes`: Persist your tested changes. **ONLY call this if the user explicitly asks to "save" or
  "persist".**
- `list-theme-variables`: Get all active `--theme--*` variables from the user's browser for pixel-perfect styling.

**Workflow**:

1. If an app is broken or looks "off": call `debug-mini-app` and `list-theme-variables`.
2. To apply a fix: call `test-mini-app-changes`.
3. Wait for user feedback or a save request.

---

## 🎨 CSS Mastery: Targeting Components

You can override any component's style by giving it a unique `id` or `class` in the `ui_schema`.

**Schema**:

```json
{
	"type": "v-button",
	"props": {
		"id": "my-submit-btn",
		"class": "custom-spacing"
	},
	"children": ["Submit"]
}
```

**CSS**:

```css
#my-submit-btn {
	margin-top: 20px;
	box-shadow: 0 4px 6px var(--theme--shadow-color);
}

.custom-spacing {
	padding: var(--theme--form--row-gap);
}
```

> [!TIP] **No Rendered HTML needed**: You don't need to see the rendered HTML structure. Just assign IDs or Classes to
> your components and target them in your CSS. **Override Defaults**: Some components like `v-card` have a default
> `max-inline-size: 400px`. Always add `#my-card { max-inline-size: 100%; }` to your CSS if you want it to fill the
> panel.

---

## 🔄 Lifecycle

To run code on mount (initial load), define `actions.init`. **The system calls this automatically** once the sandbox is
ready. Do NOT call it manually at the bottom of your script.

```javascript
state.data = null;
actions.init = async () => {
	state.data = await readItems('my_collection');
};
```

---

## ⚙️ Dynamic Configuration (`panel_config_schema`)

Mini-Apps can define their own configuration fields that are rendered reactively in the Insights panel settings.

**1. Define Schema**: Include a `panel_config_schema` (Array of `VForm` fields) in your `create`/`update` call. **2.
Access Values**: Values configured by the user in the panel are available in your script as `sdk.config`.

**Example**: **`panel_config_schema`**:

```json
[{ "field": "threshold", "type": "integer", "meta": { "interface": "input", "options": { "min": 0 } } }]
```

**`script`**:

```javascript
actions.init = async () => {
	const limit = sdk.config.threshold || 10;
	state.items = await readItems('col', { limit });
};
```

---

## 🔗 Dashboard Interop

- `dashboard.setVariable(name, value)`: Update a dashboard-wide variable.

> [!WARNING] **Reactivity Loops**: `setVariable` updates the dashboard context. Avoid calling it in `actions.init` or
> high-frequency paths if it depends on dashboard variables, as this can trigger infinite fetch loops. Always check if
> the value has actually changed before setting it.

### 🍱 Pattern: Explicit Variable Mapping

Instead of hardcoding variable names in your script, expose them as configuration options. This allows dashboard users
to "link" your mini-app to specific variables (like those from a `relational-variable` panel).

**panel_config_schema**:

```json
[
	{
		"field": "output_variable",
		"name": "Sync to Variable",
		"type": "string",
		"meta": {
			"interface": "input",
			"options": {
				"placeholder": "my_metric"
			},
			"note": "Variable name to sync the total count to."
		}
	}
]
```

**script**:

```javascript
// ALWAYS provide a fallback to prevent "undefined" variable names
// CRITICAL: The fallback ('my_metric') MUST match the placeholder in panel_config_schema
const varName = sdk.config.output_variable || 'my_metric';

// Cast values to Strings for compatibility with Label panels
dashboard.setVariable(varName, String(state.total));
```

### ⚙️ Mandatory Configuration Rule

If your mini-app uses ANY of the following, you **MUST** define them in `panel_config_schema` and use `sdk.config` in
your script:

- **Dashboard Variables**: Any variable name used in `dashboard.setVariable` or `getVariable`.
- **Functional Constants**: Item limits, thresholds, collection names, or email targets.
- **Aesthetics**: Optional titles or toggleable UI sections.

**CRITICAL**:

1.  **Placeholders**: In `panel_config_schema`, always set `meta.options.placeholder` to a realistic example.
2.  **Fallbacks**: In `script`, always provide a fallback value if the config is empty.
3.  **Consistency**: The fallback value in the script (e.g. `'my_metric'`) MUST match the placeholder in the options
    schema so the user knows the default.
4.  **Type Safety**: When syncing to text panels (Labels), `String()` cast the value.

---

## 🔒 Security & Sandbox

- `script` runs in a **QuickJS WebAssembly sandbox**.
- **No access** to `window`, `document`, `fetch`, or external URLs.
- Use `sdk` for data: `sdk.readItems`, `sdk.readItem`, `sdk.createItem`, `sdk.updateItem`, `sdk.deleteItem`, or
  `sdk.request`.
- `setTimeout` / `setInterval` are available (max 50 concurrent).

---

---

## 📖 Component "Cheat Sheet" (Common Props)

| Component  | Key Props                                                                                                                                                        | Notes                                                                                                                                                               |
| :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `v-button` | `kind` (info\|success\|warning\|danger), `onClick`, `loading`, `disabled`, `secondary`, `icon`                                                                   | Use `:loading` for async.                                                                                                                                           |
| `v-input`  | `modelValue`, `onUpdate:modelValue`, `placeholder`, `type` (text\|number), `iconLeft`                                                                            | Forward event args via action ref.                                                                                                                                  |
| `v-select` | `items` (Array<{text, value}>), `modelValue`, `onUpdate:modelValue`                                                                                              | Required for dropdowns.                                                                                                                                             |
| `v-table`  | `items` (Array), `headers` (Array), `itemKey` (String), `showSelect` (none\|single\|multiple), `selectionUseKeys` (Boolean), `modelValue`, `onUpdate:modelValue` | **CRITICAL**: Default selection is OBJECTS. Always use `selectionUseKeys: true` + `state.selected` array and trigger calculation `actions.compute()` in `onUpdate`. |
| `v-notice` | `type` (info\|success\|warning\|danger), `icon`                                                                                                                  | Best for errors and alerts.                                                                                                                                         |
| `v-card`   | `elevation` (Boolean), `outlined` (Boolean), `id` (String)                                                                                                       | **NOTE**: Has default `max-inline-size: 400px`. Use CSS `#id { max-inline-size: 100%; }` to override.                                                               |
| `v-icon`   | `icon` (Material Symbol name), `color`, `small`, `large`                                                                                                         | Native symbol icons.                                                                                                                                                |

---

---

## ⚠️ Common Pitfalls

- **State Sync**: `state` is synced via JSON. You **CANNOT** store Functions, Promises, Maps, Sets, or class instances
  in `state`. Use plain objects and arrays.
- **Error Handling**: SDK calls can fail. **ALWAYS** wrap them in `try/catch` and update a `state.error` variable to
  show feedback in the UI.
- **Initialization**: Accessing an uninitialized `state.x` in the UI schema will cause a validation error. Initialize
  EVERYTHING in your script's top level.
- **V-Tabs**: The `modelValue` for `v-tabs` MUST be an array of strings (e.g., `['tab1']`).
- **Icons**: Use Material Symbols names (e.g., `check_circle`, `settings`).

---

---

## 💎 Quality Guardrails (MANDATORY)

1.  **Mandatory Configuration**: Does the app interact with dashboard variables or have configurable constants? If yes,
    you **MUST** provide a `panel_config_schema` and use `sdk.config`. Never hardcode names used in
    `dashboard.setVariable`.
2.  **Loading Visibility**: If an action is async (like `readItems`), you MUST show a `v-progress-linear` or
    `v-progress-circular` controlled by a `state.loading` boolean.
3.  **Explicit Errors**: Wrap every SDK call in `try/catch`. Set `state.error = err.message` (or the verbose stack trace
    if available) and display it using `v-notice type="danger"`.
4.  **State Completeness**: Every state property used in `ui_schema` MUST be initialized in the `script`. **Do NOT use
    `Set` or `Map` in state.**
5.  **No Placeholders**: Never use "Lorem Ipsum". Generate realistic content or use real data.
6.  **Interactive Feedback**: Buttons involved in saving or loading MUST show the `:loading` prop.
7.  **Verbose Diagnostics**: Use the information from `debug-mini-app` (including `runtimeErrors.stack`) to perform
    accurate self-correction of scripts.

---

## 🍱 Logic Idioms

### The "Load on Init" Pattern

Always load data when the component mounts.

```javascript
state.items = [];
state.loading = false;
actions.init = async () => {
	state.loading = true;
	try {
		state.items = await readItems('collection');
	} catch (e) {
		state.error = e.message;
	} finally {
		state.loading = false;
	}
};
```

### The "Smart Search" Pattern (Local Filter)

```javascript
state.query = '';
state.all = [];
state.results = [];
const filter = () => {
	const q = state.query.toLowerCase();
	state.results = state.all.filter((i) => i.name.toLowerCase().includes(q));
};
actions.setQuery = (newVal) => {
	state.query = newVal;
	filter();
};
```

---

## 🧩 Handling Non-Technical Requests

When a user gives a vague description (e.g., "help me track expenses"), follow these steps:

1.  **Infer Collection**: Use `schema()` to find or propose a suitable collection.
2.  **Design the Flow**:
    - **List View**: Show existing records in a `v-table` or `v-list`.
    - **Create View**: Provide a `v-input` for the amount and a `v-button` to save.
    - **Feedback**: Show a `v-notice` when an item is saved.
3.  **Surprise with Quality**: Add a "Monthly Total" metric using `dashboard.setVariable` to make it professional.

---

## 🧩 Composite Patterns

### Search & Filter Pattern

**Script**:

```javascript
state.all = [];
state.filtered = [];
state.query = '';
const update = () => {
	const q = state.query.toLowerCase();
	state.filtered = state.all.filter((i) => i.name.toLowerCase().includes(q));
};
actions.setQuery = (v) => {
	state.query = v;
	update();
};
actions.init = async () => {
	state.all = await readItems('col');
	update();
};
```

### Grid Layout Pattern (CSS)

```css
.grid-container {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: var(--theme--grid-column-gap);
	padding: var(--theme--form--row-gap);
}
```

### Multi-View Pattern (Tabs/Navigation)

**Script**:

```javascript
state.view = 'list';
actions.setView = (v) => {
	state.view = v;
	if (v === 'list') actions.load();
};
```

**Schema**:

```json
{
  "type": "div",
  "children": [
    { "type": "v-tabs", "props": { "modelValue": ["state.view"], "onUpdate:modelValue": "actions.setView" } },
    { "type": "v-table", "condition": "state.view === 'list'", "props": { ... } },
    { "type": "v-form", "condition": "state.view === 'create'", "props": { ... } }
  ]
}
```

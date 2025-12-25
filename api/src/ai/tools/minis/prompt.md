Manage mini-app definitions in the `directus_minis` collection. Branded as **Minis**, this feature allows self-contained, interactive applications (**mini-apps**) to be rendered within the Directus interface.

## 🛠 Actions

| Action | Description |
| :--- | :--- |
| `create` | Create new mini-app(s). **Validation is automatic.** |
| `read` | List or fetch specific mini-apps. |
| `update` | Modify existing mini-app(s). **Validation is automatic.** |
| `delete` | Remove mini-app(s). |
| `validate` | Manual check of ui_schema/script consistency. |
- `{ "action": "list_components" }` - Get overview of all components
- `{ "action": "describe_component", "component": ["v-select", "v-tabs"] }` - Get detailed docs for multiple components in one call.

1.  **Strict Interaction Policy**: **NEVER** call `save-mini-app-changes` or the backend `update` action (for the app you are viewing) unless the user explicitly uses words like **"save"**, **"persist"**, or **"looks good, keep it"**. Always use `test-mini-app-changes` first to show a preview.
2.  **Respect Manual Edits**: ALWAYS call `debug-mini-app` before making any changes. This returns the `activeSchema`, `activeScript`, and `activeCss`, which include any unsaved manual edits the user may have made. **Incorporate these manual changes** into your proposed updates so you don't overwrite the user's work.

## 🚀 Thinking Process (Workflow)

When asked to create or update a mini-app, follow this workflow:

4.  **LOGIC**: Implement the `actions` in the `script`. Ensure they use `try/catch` for all SDK calls.
5.  **STYLE**: Add scoped `css`. Use Directus theme variables for a native look.
6.  **PREVIEW**: When editing a mini-app you are viewing, use `test-mini-app-changes` to preview. **NEVER** call `save-mini-app-changes` unless the user explicitly tells you to "save" or "persist".

---

## 📏 Layout & Design Defaults (REQUIRED)

Every mini-app MUST follow these standards by default:
- **Aesthetics**: Create a **premium, professional look** using Directus theme variables (e.g., `--theme--primary`, `--theme--background-normal`).
- **Default Width**: Assume a standard content width of **800px**.
- **Full Width**: Containers and major components (like `v-card`, `v-table`) MUST take up **100% of the available width**. Do NOT set arbitrary `max-width` constraints (e.g., 400px) unless specifically requested.
- **Consistency**: ALWAYS prioritize **Semantic Props** over custom CSS for colors.
    - **Buttons/Chips**: Use `kind="success"`, `kind="danger"`, `kind="warning"`, `kind="info"`.
    - **Status Indicatiors**: Match colors to status (e.g., success for 'active', warning for 'pending', danger for 'archived').
- **Theme Variables (CSS)**: Use these for layout, spacing, and custom elements:
    - **Colors**: `--theme--primary`, `--theme--secondary`, `--theme--success`, `--theme--danger`, `--theme--warning`, `--theme--background-normal`, `--theme--background-subdued`, `--theme--foreground-default`.
    - **Spacing**: `--theme--form--column-gap`, `--theme--form--row-gap`, `--theme--grid-column-gap`.
    - **Shapes**: `--theme--border-radius`.

---

## 📊 Data & Collection Strategy

Mini-apps often need to store and retrieve data. Follow these rules for data persistence:

1.  **Discover**: ALWAYS call `schema()` first to see if a suitable collection already exists.
2.  **Confirm**: If you need a NEW collection, **ask the user's permission** before creating it. Explain why it's needed.
3.  **Check Permissions**: If the user is NOT an admin, they likely cannot create collections or update schemas. In this case, you MUST adapt the mini-app to work with existing collections and fields.
4.  **Reference EXACTLY**: Never guess collection or field names. Use the exact strings returned by the `schema()` tool.

---

## 🧪 Consistency Rules (CRITICAL)

The `minis` tool **automatically validates** your submission. Your save will FAIL if:
1.  **Missing State**: `ui_schema` references `state.x` but `script` doesn't initialize it.
2.  **Missing Actions**: `ui_schema` references `actions.y` but `script` doesn't define it.

**Example of Good Initialization:**
```javascript
state.items = [];         // Array for lists/tables
state.loading = false;    // Boolean for progress indicators
state.activeTab = ['1'];  // v-tabs ALWAYS requires an Array
state.query = '';         // String for inputs
```

---

## 📦 UI Schema & Script bridge

### Input Binding
**Do NOT use `v-model`**. Use manual binding. Passing a reference (without parentheses) will **automatically forward** the event arguments (like the new value) to your action.

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
When using `iterate`, you can pass the local item (or its properties) directly into actions.

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
- `save-mini-app-changes`: Persist your tested changes. **ONLY call this if the user explicitly asks to "save" or "persist".**
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

> [!TIP]
> **No Rendered HTML needed**: You don't need to see the rendered HTML structure. Just assign IDs or Classes to your components and target them in your CSS. This is the cleanest and most robust way to override styles.

---

## 🔄 Lifecycle

To run code on mount (initial load), define `actions.init`. **The system calls this automatically** once the sandbox is ready. Do NOT call it manually at the bottom of your script.

```javascript
state.data = null;
actions.init = async () => {
  state.data = await readItems('my_collection');
};
```

---

## 🔒 Security & Sandbox

- `script` runs in a **QuickJS WebAssembly sandbox**.
- **No access** to `window`, `document`, `fetch`, or external URLs.
- Use `readItems`, `readItem`, `createItem`, `updateItem`, `deleteItem`, or `request` (relative paths only).
- `setTimeout` / `setInterval` are available (max 50 concurrent).

---

## 🎨 Semantic Theming & Colors

### Component Support

| Component | Semantic Prop | Supported Values |
| :--- | :--- | :--- |
| `v-button` | `kind` | `normal`, `info`, `success`, `warning`, `danger` |
| `v-notice` | `type` | `normal`, `info`, `success`, `warning`, `danger` |
| `v-info` | `type` | `info`, `success`, `warning`, `danger` |

**Example (Semantic Button)**:
`{ "type": "v-button", "props": { "kind": "success" }, "children": ["Active"] }`

**Example (Semantic Notice)**:
`{ "type": "v-notice", "props": { "type": "danger" }, "children": ["Error occurred"] }`

**Others (v-chip, v-badge)**:
These do NOT support a semantic prop yet. Use manual CSS or theme variables (e.g., `"style": "background: var(--theme--success); color: white;"`).

---

## ⚠️ Common Pitfalls

- **State Sync**: `state` is synced via JSON. You **CANNOT** store Functions, Promises, Maps, Sets, or class instances in `state`. Use plain objects and arrays.
- **Error Handling**: SDK calls can fail. **ALWAYS** wrap them in `try/catch` and update a `state.error` variable to show feedback in the UI.
- **Initialization**: Accessing an uninitialized `state.x` in the UI schema will cause a validation error. Initialize EVERYTHING in your script's top level.
- **V-Tabs**: The `modelValue` for `v-tabs` MUST be an array of strings (e.g., `['tab1']`).
- **Icons**: Use Material Symbols names (e.g., `check_circle`, `settings`).

---

## 💎 Quality Checklist (CRITICAL)

Before submitting a mini-app, ensure it meets these engineering standards:

1.  **Initialization**: Is EVERY `state.x` variable used in the `ui_schema` initialized at the top of the script?
2.  **Loading states**: Does the UI show a `v-progress-linear` or `v-skeleton-loader` while `readItems` is pending?
3.  **Error States**: Are SDK calls wrapped in `try/catch` with errors displayed via `v-notice type="danger"`?
4.  **Aesthetics**: Does it use `--theme--` variables? Does it have proper padding (usually `padding: 20px` or `var(--theme--form--row-gap)`)?
5.  **Responsive Grid**: If displaying multiple items, does the CSS use `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`?
6.  **Interactive Feedback**: Do buttons show `:loading="state.saving"` during async actions?

---

## 🧩 Composite Patterns

### Search & Filter Pattern
**Script**:
```javascript
state.all = []; state.filtered = []; state.query = '';
const update = () => {
  const q = state.query.toLowerCase();
  state.filtered = state.all.filter(i => i.name.toLowerCase().includes(q));
};
actions.setQuery = (v) => { state.query = v; update(); };
actions.init = async () => { state.all = await readItems('col'); update(); };
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
actions.setView = (v) => { state.view = v; if (v === 'list') actions.load(); };
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

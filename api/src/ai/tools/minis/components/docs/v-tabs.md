# v-tabs

Tab navigation component for switching between content panels.

## Important Notes

1. **Parent-child pattern**: `v-tabs` contains `v-tab` children
2. **Value matching**: Each `v-tab` needs a `value` prop that matches content conditions
3. **Content visibility**: Use boolean state flags for tab content (condition doesn't support `===`)

## Basic Usage

```json
{
	"type": "div",
	"children": [
		{
			"type": "v-tabs",
			"props": {
				"modelValue": "state.activeTab",
				"onUpdate:modelValue": "actions.setTab"
			},
			"children": [
				{ "type": "v-tab", "props": { "value": "info" }, "children": ["Info"] },
				{ "type": "v-tab", "props": { "value": "settings" }, "children": ["Settings"] },
				{ "type": "v-tab", "props": { "value": "advanced" }, "children": ["Advanced"] }
			]
		},
		{
			"type": "div",
			"props": { "class": "tab-content" },
			"children": [
				{
					"type": "div",
					"condition": "state.showInfo",
					"children": ["Info content here"]
				},
				{
					"type": "div",
					"condition": "state.showSettings",
					"children": ["Settings content here"]
				},
				{
					"type": "div",
					"condition": "state.showAdvanced",
					"children": ["Advanced content here"]
				}
			]
		}
	]
}
```

**Required Script:**

```javascript
state.activeTab = ['info']; // Array format for v-tabs
state.showInfo = true;
state.showSettings = false;
state.showAdvanced = false;

actions.setTab = (value) => {
	state.activeTab = value;
	const tab = value[0]; // First selected tab

	// Update visibility flags
	state.showInfo = tab === 'info';
	state.showSettings = tab === 'settings';
	state.showAdvanced = tab === 'advanced';
};
```

## Props

### v-tabs

| Prop                  | Type    | Default  | Description                     |
| --------------------- | ------- | -------- | ------------------------------- |
| `modelValue`          | Array   | []       | Currently selected tab value(s) |
| `onUpdate:modelValue` | action  | required | Handler for tab changes         |
| `vertical`            | boolean | false    | Display tabs vertically         |

### v-tab

| Prop       | Type          | Default | Description                   |
| ---------- | ------------- | ------- | ----------------------------- |
| `value`    | string/number | auto    | Unique identifier for the tab |
| `disabled` | boolean       | false   | Disable this tab              |

## Vertical Tabs

```json
{
	"type": "div",
	"props": { "style": "display: flex; gap: 20px" },
	"children": [
		{
			"type": "v-tabs",
			"props": {
				"modelValue": "state.activeTab",
				"onUpdate:modelValue": "actions.setTab",
				"vertical": true
			},
			"children": [
				{ "type": "v-tab", "props": { "value": "general" }, "children": ["General"] },
				{ "type": "v-tab", "props": { "value": "appearance" }, "children": ["Appearance"] },
				{ "type": "v-tab", "props": { "value": "privacy" }, "children": ["Privacy"] }
			]
		},
		{
			"type": "div",
			"props": { "style": "flex: 1" },
			"children": [
				{ "type": "div", "condition": "state.showGeneral", "children": ["General settings..."] },
				{ "type": "div", "condition": "state.showAppearance", "children": ["Appearance settings..."] },
				{ "type": "div", "condition": "state.showPrivacy", "children": ["Privacy settings..."] }
			]
		}
	]
}
```

## With Icons

```json
{
	"type": "v-tabs",
	"props": {
		"modelValue": "state.activeTab",
		"onUpdate:modelValue": "actions.setTab"
	},
	"children": [
		{
			"type": "v-tab",
			"props": { "value": "home" },
			"children": [
				{ "type": "v-icon", "props": { "name": "home", "small": true } },
				{ "type": "span", "children": [" Home"] }
			]
		},
		{
			"type": "v-tab",
			"props": { "value": "search" },
			"children": [
				{ "type": "v-icon", "props": { "name": "search", "small": true } },
				{ "type": "span", "children": [" Search"] }
			]
		}
	]
}
```

## Complete Example: User Profile Editor

```json
{
	"type": "v-card",
	"children": [
		{
			"type": "v-card-title",
			"children": ["User Profile"]
		},
		{
			"type": "v-tabs",
			"props": {
				"modelValue": "state.activeTab",
				"onUpdate:modelValue": "actions.setTab"
			},
			"children": [
				{ "type": "v-tab", "props": { "value": "profile" }, "children": ["Profile"] },
				{ "type": "v-tab", "props": { "value": "security" }, "children": ["Security"] },
				{ "type": "v-tab", "props": { "value": "notifications" }, "children": ["Notifications"] }
			]
		},
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "div",
					"condition": "state.showProfile",
					"children": [
						{ "type": "h3", "children": ["Profile Information"] },
						{
							"type": "v-input",
							"props": {
								"modelValue": "state.userName",
								"onUpdate:modelValue": "actions.setUserName",
								"placeholder": "Your name"
							}
						}
					]
				},
				{
					"type": "div",
					"condition": "state.showSecurity",
					"children": [
						{ "type": "h3", "children": ["Security Settings"] },
						{
							"type": "v-checkbox",
							"props": {
								"modelValue": "state.twoFactor",
								"onUpdate:modelValue": "actions.setTwoFactor",
								"label": "Enable two-factor authentication"
							}
						}
					]
				},
				{
					"type": "div",
					"condition": "state.showNotifications",
					"children": [
						{ "type": "h3", "children": ["Notification Preferences"] },
						{
							"type": "v-checkbox",
							"props": {
								"modelValue": "state.emailNotifs",
								"onUpdate:modelValue": "actions.setEmailNotifs",
								"label": "Email notifications"
							}
						}
					]
				}
			]
		}
	]
}
```

```javascript
state.activeTab = ['profile'];
state.showProfile = true;
state.showSecurity = false;
state.showNotifications = false;
state.userName = '';
state.twoFactor = false;
state.emailNotifs = true;

actions.setTab = (value) => {
	state.activeTab = value;
	const tab = value[0];
	state.showProfile = tab === 'profile';
	state.showSecurity = tab === 'security';
	state.showNotifications = tab === 'notifications';
};

actions.setUserName = (val) => {
	state.userName = val;
};
actions.setTwoFactor = (val) => {
	state.twoFactor = val;
};
actions.setEmailNotifs = (val) => {
	state.emailNotifs = val;
};
```

## Alternative: Using v-tabs-items (Advanced)

For more complex scenarios, you can use `v-tabs-items` and `v-tab-item`:

```json
{
	"type": "div",
	"children": [
		{
			"type": "v-tabs",
			"props": { "modelValue": "state.activeTab", "onUpdate:modelValue": "actions.setTab" },
			"children": [
				{ "type": "v-tab", "props": { "value": "a" }, "children": ["Tab A"] },
				{ "type": "v-tab", "props": { "value": "b" }, "children": ["Tab B"] }
			]
		},
		{
			"type": "v-tabs-items",
			"props": { "modelValue": "state.activeTab" },
			"children": [
				{ "type": "v-tab-item", "props": { "value": "a" }, "children": ["Content A"] },
				{ "type": "v-tab-item", "props": { "value": "b" }, "children": ["Content B"] }
			]
		}
	]
}
```

Note: This approach requires the same `modelValue` to be passed to both `v-tabs` and `v-tabs-items`.

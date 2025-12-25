# v-icon

Material Design icon display component.

## Basic Usage

```json
{
	"type": "v-icon",
	"props": { "name": "check" }
}
```

## Props

| Prop        | Type    | Default  | Description                            |
| ----------- | ------- | -------- | -------------------------------------- |
| `name`      | string  | required | Material icon name                     |
| `filled`    | boolean | false    | Use filled variant                     |
| `sup`       | boolean | false    | Superscript position                   |
| `left`      | boolean | false    | Add right margin (for use before text) |
| `right`     | boolean | false    | Add left margin (for use after text)   |
| `disabled`  | boolean | false    | Dim the icon                           |
| `clickable` | boolean | false    | Show pointer cursor                    |
| `color`     | string  | null     | CSS color value                        |
| `xSmall`    | boolean | false    | Extra small size                       |
| `small`     | boolean | false    | Small size                             |
| `large`     | boolean | false    | Large size                             |
| `xLarge`    | boolean | false    | Extra large size                       |

## Common Icons

| Icon Name        | Use Case              |
| ---------------- | --------------------- |
| `check`          | Success, confirmation |
| `close`          | Close, cancel         |
| `add`            | Create new            |
| `edit`           | Edit/modify           |
| `delete`         | Delete/remove         |
| `search`         | Search                |
| `settings`       | Settings              |
| `person`         | User/profile          |
| `home`           | Home/dashboard        |
| `folder`         | Folder/category       |
| `file_copy`      | Files/documents       |
| `star`           | Favorite              |
| `visibility`     | View/show             |
| `visibility_off` | Hide                  |
| `expand_more`    | Expand down           |
| `expand_less`    | Collapse up           |
| `chevron_right`  | Navigate forward      |
| `chevron_left`   | Navigate back         |
| `refresh`        | Refresh/reload        |
| `info`           | Information           |
| `warning`        | Warning               |
| `error`          | Error                 |
| `help`           | Help                  |

## Sizes

```json
{
	"type": "div",
	"props": { "style": "display: flex; gap: 16px; align-items: center;" },
	"children": [
		{ "type": "v-icon", "props": { "name": "star", "xSmall": true } },
		{ "type": "v-icon", "props": { "name": "star", "small": true } },
		{ "type": "v-icon", "props": { "name": "star" } },
		{ "type": "v-icon", "props": { "name": "star", "large": true } },
		{ "type": "v-icon", "props": { "name": "star", "xLarge": true } }
	]
}
```

## With Text (Button)

```json
{
	"type": "v-button",
	"props": { "onClick": "actions.save" },
	"children": [{ "type": "v-icon", "props": { "name": "save", "left": true } }, "Save"]
}
```

```json
{
	"type": "v-button",
	"props": { "onClick": "actions.next" },
	"children": ["Next", { "type": "v-icon", "props": { "name": "arrow_forward", "right": true } }]
}
```

## Custom Color

```json
{
	"type": "div",
	"props": { "style": "display: flex; gap: 16px;" },
	"children": [
		{ "type": "v-icon", "props": { "name": "check_circle", "color": "var(--theme--success)" } },
		{ "type": "v-icon", "props": { "name": "warning", "color": "var(--theme--warning)" } },
		{ "type": "v-icon", "props": { "name": "error", "color": "var(--theme--danger)" } },
		{ "type": "v-icon", "props": { "name": "info", "color": "var(--theme--primary)" } }
	]
}
```

## Clickable Icon

```json
{
	"type": "v-icon",
	"props": {
		"name": "favorite",
		"clickable": true,
		"color": "state.isFavorite ? 'var(--theme--danger)' : null",
		"onClick": "actions.toggleFavorite"
	}
}
```

Note: For clickable icons, prefer wrapping in a button for better accessibility.

## Status Indicator

```json
{
	"type": "div",
	"props": { "style": "display: flex; align-items: center; gap: 8px;" },
	"children": [
		{
			"type": "v-icon",
			"props": {
				"name": "state.status === 'active' ? 'check_circle' : 'cancel'",
				"color": "state.status === 'active' ? 'var(--theme--success)' : 'var(--theme--danger)'",
				"small": true
			}
		},
		{ "type": "span", "children": ["{{ state.statusText }}"] }
	]
}
```

Note: The above dynamic prop binding may not work - calculate icon name in state instead:

```javascript
state.status = 'active';
state.statusIcon = 'check_circle';
state.statusColor = 'var(--theme--success)';
state.statusText = 'Active';

actions.updateStatus = (status) => {
	state.status = status;
	if (status === 'active') {
		state.statusIcon = 'check_circle';
		state.statusColor = 'var(--theme--success)';
		state.statusText = 'Active';
	} else {
		state.statusIcon = 'cancel';
		state.statusColor = 'var(--theme--danger)';
		state.statusText = 'Inactive';
	}
};
```

```json
{
	"type": "div",
	"props": { "style": "display: flex; align-items: center; gap: 8px;" },
	"children": [
		{
			"type": "v-icon",
			"props": {
				"name": "state.statusIcon",
				"color": "state.statusColor",
				"small": true
			}
		},
		{ "type": "span", "children": ["{{ state.statusText }}"] }
	]
}
```

## In List Items

```json
{
	"type": "v-list-item",
	"children": [
		{
			"type": "v-list-item-icon",
			"children": [{ "type": "v-icon", "props": { "name": "folder" } }]
		},
		{
			"type": "v-list-item-content",
			"children": ["Documents"]
		}
	]
}
```

## Notes

- Icons use Material Design icon names
- Browse icons at: https://fonts.google.com/icons
- Use `left: true` or `right: true` for proper spacing with text
- Use CSS color variables for theme consistency

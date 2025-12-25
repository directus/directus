<script setup lang="ts">
import { computed, h, resolveComponent, VNode, type Component } from 'vue';
import { render } from 'micromustache';
import { get } from 'lodash';

export interface UiSchemaNode {
	type: string;
	props?: Record<string, any>;
	children?: UiSchemaNode[] | string | any;
	condition?: string;
	iterate?: string;
	as?: string;
	template?: UiSchemaNode;
}

export interface RenderWarning {
	type: 'whitelist' | 'action-args' | 'action-error' | 'resolution';
	message: string;
	component?: string;
	timestamp: number;
}

const props = defineProps<{
	schema: UiSchemaNode | string | null;
	state: Record<string, any>;
	actions: Record<string, (...args: any[]) => any>;
	onWarning?: (warning: RenderWarning) => void;
}>();

/**
 * Emit a warning to both the console and the parent component.
 * This allows warnings to be surfaced to the AI debugging tools.
 */
function emitWarning(type: RenderWarning['type'], message: string, component?: string): void {
	// Always log to console for developer visibility
	// eslint-disable-next-line no-console
	console.warn(`[MiniApp]${component ? ` [${component}]` : ''} ${message}`);

	// Emit to parent if callback is provided
	if (props.onWarning) {
		props.onWarning({
			type,
			message,
			component,
			timestamp: Date.now(),
		});
	}
}

// Parse schema if it's a string (shouldn't happen but handle gracefully)
const parsedSchema = computed(() => {
	if (!props.schema) return null;

	if (typeof props.schema === 'string') {
		try {
			return JSON.parse(props.schema) as UiSchemaNode;
		} catch {
			return null;
		}
	}

	return props.schema;
});

// Whitelist of allowed components
const ALLOWED_COMPONENTS = new Set([
	// Virtual container for iteration
	'template',

	// Directus components - Layout
	'v-card',
	'v-card-title',
	'v-card-text',
	'v-card-actions',
	'v-card-subtitle',
	'v-sheet',
	'v-divider',
	'v-detail',
	'v-overlay',

	// Directus components - Input
	'v-input',
	'v-textarea',
	'v-select',
	'v-checkbox',
	'v-radio',
	'v-slider',

	// Directus components - Display
	'v-button',
	'v-icon',
	'v-avatar',
	'v-badge',
	'v-chip',
	'v-notice',
	'v-info',
	'v-image',
	'v-highlight',

	// Directus components - Lists
	'v-list',
	'v-list-item',
	'v-list-item-icon',
	'v-list-item-content',
	'v-list-item-hint',
	'v-list-group',
	'v-table',

	// Directus components - Navigation
	'v-tabs',
	'v-tab',
	'v-tabs-items',
	'v-tab-item',
	'v-pagination',
	'v-breadcrumb',

	// Directus components - Feedback
	'v-progress-linear',
	'v-progress-circular',
	'v-skeleton-loader',
	'v-text-overflow',
	'v-hover',
	'v-error',
	'v-error-boundary',

	// HTML elements
	'div',
	'span',
	'p',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'ul',
	'ol',
	'li',
	'a',
	'img',
	'br',
	'hr',
	'strong',
	'em',
	'code',
	'pre',
]);

// Pre-resolve all Vue components at setup time to avoid calling resolveComponent during render
const componentMap = new Map<string, Component | string>();

for (const name of ALLOWED_COMPONENTS) {
	if (name.startsWith('v-')) {
		// Convert kebab-case to PascalCase for Vue component resolution
		const pascalName = name
			.split('-')
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join('');

		componentMap.set(name, resolveComponent(pascalName));
	} else {
		// HTML elements are used as-is
		componentMap.set(name, name);
	}
}

// Resolve a state path like "state.display" or "state.items[0].name"
function resolveStatePath(path: string): any {
	const parts = path.slice(6).split('.');
	let current: any = props.state;

	for (const part of parts) {
		if (current === undefined || current === null) return undefined;
		current = current[part];
	}

	return current;
}

// Resolve a value from state or return literal
function resolveValue(value: any, extraContext: Record<string, any> = {}): any {
	if (typeof value !== 'string') return value;

	// Handle mustache-style template interpolation: {{ expression }}
	if (value.includes('{{') && value.includes('}}')) {
		// Use micromustache for logic-less, safe interpolation
		// It only supports dot notation: {{ state.user.name }}
		try {
			const context = {
				state: props.state,
				...extraContext,
			};

			return render(value, context);
		} catch {
			return value; // Fallback to original string on error
		}
	}

	// Check if it's a state reference (e.g., "state.query")
	if (value.startsWith('state.')) {
		return resolveStatePath(value);
	}

	// Check if it's an action reference (e.g., "actions.search")
	if (value.startsWith('actions.')) {
		const actionName = value.slice(8);
		return props.actions[actionName];
	}

	return value;
}

/**
 * Safely parse action arguments without eval.
 * Only allows JSON primitives: strings, numbers, booleans, null, arrays, objects.
 * Converts single quotes to double quotes for convenience (e.g., 'hello' -> "hello").
 */
function parseActionArgs(argsStr: string, context: Record<string, any>): unknown[] {
	if (!argsStr || !argsStr.trim()) return [];

	// Split by comma while respecting quotes and parentheses (simple version)
	const args = argsStr.split(',').map((s) => s.trim());

	return args.map((arg) => {
		// 1. Try to parse as JSON primitive (number, boolean, null, string in quotes)
		try {
			// Convert single-quoted strings to double-quoted (JSON standard)
			const normalized = arg.replace(
				/'([^'\\]*(\\.[^'\\]*)*)'/g,
				(_, content: string) => `"${content.replace(/\\'/g, "'").replace(/"/g, '\\"')}"`,
			);

			return JSON.parse(normalized);
		} catch {
			// 2. If not JSON, try to resolve as variable path in context
			// e.g., "item", "item.id", "state.val"
			return get(context, arg);
		}
	});
}

// Create an action handler from a string like "actions.press('7')" or "actions.clear"
// Actions are async (from QuickJS sandbox) so we handle the promise and catch errors
function createActionHandler(
	value: string,
	extraContext: Record<string, any> = {},
): ((...args: any[]) => Promise<void>) | undefined {
	if (!value.startsWith('actions.')) return undefined;

	// Check if it's a function call with arguments: actions.press('7')
	const callMatch = value.match(/^actions\.(\w+)\((.*)\)$/);

	if (callMatch) {
		const [, actionName, argsStr] = callMatch;

		return async () => {
			const action = props.actions[actionName!];

			if (typeof action === 'function') {
				const context = {
					state: props.state,
					...extraContext,
				};

				const args = parseActionArgs(argsStr!, context);

				try {
					await action(...args);
				} catch (err) {
					emitWarning('action-error', `Action "${actionName}" error: ${err}`);
				}
			}
		};
	}

	// Simple action reference: actions.clear
	const actionName = value.slice(8);

	return async (...eventArgs: any[]) => {
		const action = props.actions[actionName];

		if (typeof action === 'function') {
			try {
				// Forward arguments received from the Vue event (e.g., input values)
				await action(...eventArgs);
			} catch (err) {
				emitWarning('action-error', `Action "${actionName}" error: ${err}`);
			}
		}
	};
}

// Check if a condition is met
// Supporting only simple property access or negation
function checkCondition(condition: string | undefined, extraContext: Record<string, any> = {}): boolean {
	if (!condition) return true;

	const context = {
		state: props.state,
		...extraContext,
	};

	let expr = condition.trim();
	let isNegated = false;

	if (expr.startsWith('!')) {
		isNegated = true;
		expr = expr.slice(1).trim();
	}

	// Support 'state.path.to.value'
	if (expr.startsWith('state.')) {
		// Remove 'state.' prefix because we look up in props.state (or context.state)
		const path = expr.slice(6);
		const value = get(context.state, path);
		return isNegated ? !value : !!value;
	}

	// Fallback: deny all other expressions (fail safe)
	return false;
}

// Process props, resolving state/action references
function processProps(nodeProps: Record<string, any> | undefined): Record<string, any> {
	if (!nodeProps) return {};

	const processed: Record<string, any> = {};

	for (const [key, value] of Object.entries(nodeProps)) {
		// Handle event bindings (onClick, onUpdate:modelValue, etc.)
		if (key.startsWith('on') || key.includes(':')) {
			if (typeof value === 'string' && value.startsWith('actions.')) {
				// Create action handler for both simple refs and function calls
				const handler = createActionHandler(value);

				if (handler) {
					processed[key] = handler;
				}
			} else {
				const resolved = resolveValue(value);

				if (typeof resolved === 'function') {
					processed[key] = resolved;
				}
			}
		} else {
			processed[key] = resolveValue(value);
		}
	}

	return processed;
}

// Render a single schema node
function renderNode(node: UiSchemaNode, index?: number): VNode | VNode[] | string | null {
	// Check condition
	if (!checkCondition(node.condition)) {
		return null;
	}

	// Validate component type
	if (!ALLOWED_COMPONENTS.has(node.type)) {
		emitWarning('whitelist', `Component type "${node.type}" is not allowed`, node.type);
		return null;
	}

	// Handle iteration
	if (node.iterate && node.template) {
		const items = resolveValue(node.iterate);

		if (!Array.isArray(items)) return null;

		const renderedItems = items
			.map((item, idx) => {
				// Create a local state with the iterated item
				const iterState = { ...props.state, [node.as || 'item']: item, index: idx };

				return renderNodeWithState(node.template!, iterState, idx);
			})
			.filter((item): item is VNode => item !== null);

		return renderedItems;
	}

	// Get the pre-resolved component from the map
	const component = componentMap.get(node.type) ?? node.type;

	// Process props
	const processedProps = processProps(node.props);

	// Add key if index provided
	if (index !== undefined) {
		processedProps.key = index;
	}

	// Process children
	let children: any = undefined;

	if (node.children) {
		let rawChildren: any = undefined;

		if (typeof node.children === 'string') {
			rawChildren = resolveValue(node.children);
		} else if (Array.isArray(node.children)) {
			rawChildren = node.children
				.map((child: UiSchemaNode | string, idx: number) => {
					if (typeof child === 'string') {
						return resolveValue(child);
					}

					return renderNode(child, idx);
				})
				.filter((c): c is VNode | string => c !== null);
		}

		if (rawChildren !== undefined) {
			// For Vue components, wrap in default slot function; for HTML elements, pass directly
			if (node.type.startsWith('v-')) {
				children = { default: () => rawChildren };
			} else {
				children = rawChildren;
			}
		}
	}

	return h(component, processedProps, children);
}

// Render with custom state (for iteration)
function renderNodeWithState(
	node: UiSchemaNode,
	customState: Record<string, any>,
	index: number,
): VNode | VNode[] | string | null {
	// Check condition with custom state
	if (node.condition) {
		if (!checkCondition(node.condition, customState)) return null;
	}

	if (!ALLOWED_COMPONENTS.has(node.type)) {
		emitWarning('whitelist', `Component type "${node.type}" is not allowed`, node.type);
		return null;
	}

	// Helper to resolve value from custom state
	const resolveCustomValue = (value: any): any => {
		if (typeof value !== 'string') return value;

		// 1. Handle interpolation {{ expr }} using custom state (delegated to resolveValue which uses micromustache)
		if (value.includes('{{') && value.includes('}}')) {
			return resolveValue(value, customState);
		}

		// 2. Try to match keys in custom state (e.g. "article.title" or "index")
		const itemName = Object.keys(customState).find((k) => value === k || value.startsWith(`${k}.`));

		if (itemName) {
			if (value === itemName) return customState[itemName];

			const path = value.slice(itemName.length + 1);
			return get(customState[itemName], path);
		}

		// 3. Fallback to standard resolve (for global state/actions)
		return resolveValue(value, customState);
	};

	// Get the pre-resolved component from the map
	const component = componentMap.get(node.type) ?? node.type;

	// Process props with custom state
	const processedProps: Record<string, any> = { key: index };

	if (node.props) {
		for (const [key, value] of Object.entries(node.props)) {
			// Handle events for custom items
			if ((key.startsWith('on') || key.includes(':')) && typeof value === 'string' && value.startsWith('actions.')) {
				const handler = createActionHandler(value, customState);
				if (handler) processedProps[key] = handler;
			} else {
				processedProps[key] = resolveCustomValue(value);
			}
		}
	}

	// Process children with custom state
	let children: any = undefined;

	if (node.children) {
		let rawChildren: any = undefined;

		if (typeof node.children === 'string') {
			rawChildren = resolveCustomValue(node.children);
		} else if (Array.isArray(node.children)) {
			rawChildren = node.children
				.map((child: UiSchemaNode | string, idx: number) => {
					if (typeof child === 'string') {
						return resolveCustomValue(child);
					}

					return renderNodeWithState(child, customState, idx);
				})
				.filter((c): c is VNode | string => c !== null);
		}

		if (rawChildren !== undefined) {
			// For Vue components, wrap in default slot function; for HTML elements, pass directly
			if (node.type.startsWith('v-')) {
				children = { default: () => rawChildren };
			} else {
				children = rawChildren;
			}
		}
	}

	return h(component, processedProps, children);
}

const renderedContent = computed(() => {
	if (!parsedSchema.value) return null;
	return renderNode(parsedSchema.value);
});
</script>

<template>
	<component :is="() => renderedContent" />
</template>

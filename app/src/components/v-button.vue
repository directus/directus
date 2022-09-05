<template>
	<div class="v-button" :class="{ secondary, warning, danger, 'full-width': fullWidth, rounded }">
		<slot name="prepend-outer" />
		<component
			:is="component"
			v-focus="autofocus"
			:download="download"
			class="button"
			:class="[
				sizeClass,
				`align-${align}`,
				{
					active: isActiveRoute,
					icon,
					outlined,
					loading,
					dashed,
					tile,
					'full-width': fullWidth,
				},
				kind,
			]"
			:type="type"
			:disabled="disabled"
			v-bind="additionalProps"
			@click="onClick"
		>
			<span class="content" :class="{ invisible: loading }">
				<slot v-bind="{ active, toggle }" />
			</span>
			<div class="spinner">
				<slot v-if="loading" name="loading">
					<v-progress-circular :x-small="xSmall" :small="small" indeterminate />
				</slot>
			</div>
		</component>
		<slot name="append-outer" />
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouteLocation, useRoute, useLink } from 'vue-router';
import { useSizeClass, useGroupable } from '@directus/shared/composables';
import { isEqual, isNil } from 'lodash';

interface Props {
	/** Automatically focuses on the button */
	autofocus?: boolean;
	/** Styling of the button */
	kind?: 'normal' | 'info' | 'success' | 'warning' | 'danger';
	/** Stretches the button to it's maximal width */
	fullWidth?: boolean;
	/** Enable rounded corners */
	rounded?: boolean;
	/** No background */
	outlined?: boolean;
	/** Remove padding / min-width. Meant to be used with just an icon as content */
	icon?: boolean;
	/** Element type to be used */
	type?: string;
	/** Disables the button */
	disabled?: boolean;
	/** Show a circular progress bar */
	loading?: boolean;
	/** To what internal link the button should direct */
	to?: string | RouteLocation;
	/** To what external link the button should direct */
	href?: string;
	/** Renders the button highlighted */
	active?: boolean;
	/** If the button should be highlighted if it matches the current internal link */
	exact?: boolean;
	/** Renders the button highlighted when it matches the given query  */
	query?: boolean;
	/** Renders the button in a less important styling */
	secondary?: boolean;
	/** @deprecated The `kind` prop should be used instead */
	warning?: boolean;
	/** @deprecated The `kind` prop should be used instead */
	danger?: boolean;
	/** What value to use for the button when rendered inside a group of buttons */
	value?: number | string;
	/** Renders the button with a dashed border */
	dashed?: boolean;
	/** Renders the button as a square */
	tile?: boolean;
	/** Align the button to a given side */
	align?: 'left' | 'center' | 'right';
	/** Add the download attribute (used in combo with `href`) */
	download?: string;
	/** Renders a smaller button */
	xSmall?: boolean;
	/** Renders a small button */
	small?: boolean;
	/** Renders a large button */
	large?: boolean;
	/** Renders a larger button */
	xLarge?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	autofocus: false,
	kind: 'normal',
	fullWidth: false,
	rounded: false,
	outlined: false,
	icon: false,
	type: 'button',
	disabled: false,
	loading: false,
	to: '',
	href: undefined,
	active: undefined,
	exact: false,
	query: false,
	secondary: false,
	warning: false,
	danger: false,
	value: undefined,
	dashed: false,
	tile: false,
	align: 'center',
	download: undefined,
});

const emit = defineEmits(['click']);

const route = useRoute();

const { route: linkRoute, isActive, isExactActive } = useLink(props);

const sizeClass = useSizeClass(props);

const component = computed(() => {
	if (props.disabled) return 'button';
	if (!isNil(props.href)) return 'a';
	if (props.to) return 'router-link';
	return 'button';
});

const additionalProps = computed(() => {
	if (props.to) {
		return {
			to: props.to,
		};
	}

	if (component.value === 'a') {
		return {
			href: props.href,
			target: '_blank',
			rel: 'noopener noreferrer',
		};
	}

	return {};
});

const { active, toggle } = useGroupable({
	value: props.value,
	group: 'item-group',
});

const isActiveRoute = computed(() => {
	if (props.active !== undefined) return props.active;

	if (props.to) {
		const isQueryActive = !props.query || isEqual(route.query, linkRoute.value.query);

		if (!props.exact) {
			return (isActive.value && isQueryActive) || active.value;
		} else {
			return (isExactActive.value && isQueryActive) || active.value;
		}
	}

	return false;
});

async function onClick(event: MouseEvent) {
	if (props.loading === true) return;
	// Toggles the active state in the parent groupable element. Allows buttons to work ootb in button-groups
	toggle();
	emit('click', event);
}
</script>

<style scoped>
:global(body) {
	--v-button-width: auto;
	--v-button-height: 44px;
	--v-button-color: var(--foreground-inverted);
	--v-button-color-hover: var(--foreground-inverted);
	--v-button-color-active: var(--foreground-inverted);
	--v-button-color-disabled: var(--foreground-subdued);
	--v-button-background-color: var(--primary);
	--v-button-background-color-hover: var(--primary-125);
	--v-button-background-color-active: var(--primary);
	--v-button-background-color-disabled: var(--background-normal);
	--v-button-font-size: 16px;
	--v-button-font-weight: 600;
	--v-button-line-height: 22px;
	--v-button-min-width: 140px;
}

.info {
	--v-button-color: var(--white);
	--v-button-color-hover: var(--white);
	--v-button-background-color: var(--blue);
	--v-button-background-color-hover: var(--blue-125);
	--v-button-background-color-active: var(--blue);
}

.success {
	--v-button-color: var(--white);
	--v-button-color-hover: var(--white);
	--v-button-background-color: var(--success);
	--v-button-background-color-hover: var(--success-125);
	--v-button-background-color-active: var(--success);
}

.warning {
	--v-button-color: var(--white);
	--v-button-color-hover: var(--white);
	--v-button-background-color: var(--warning);
	--v-button-background-color-hover: var(--warning-125);
	--v-button-background-color-active: var(--warning);
}

.danger {
	--v-button-color: var(--white);
	--v-button-color-hover: var(--white);
	--v-button-background-color: var(--danger);
	--v-button-background-color-hover: var(--danger-125);
	--v-button-background-color-active: var(--danger);
}

.secondary {
	--v-button-color: var(--foreground-normal);
	--v-button-color-hover: var(--foreground-normal);
	--v-button-color-active: var(--foreground-normal);
	--v-button-background-color: var(--border-subdued);
	--v-button-background-color-hover: var(--background-normal-alt);
	--v-button-background-color-active: var(--background-normal-alt);
}

.secondary.rounded {
	--v-button-background-color: var(--background-normal);
	--v-button-background-color-active: var(--background-normal);
	--v-button-background-color-hover: var(--background-normal-alt);
}

.warning.rounded {
	--v-button-background-color: var(--warning-10);
	--v-button-color: var(--warning);
	--v-button-background-color-hover: var(--warning-25);
	--v-button-color-hover: var(--warning);
}

.danger.rounded {
	--v-button-background-color: var(--danger-10);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-25);
	--v-button-color-hover: var(--danger);
}

.v-button {
	display: inline-flex;
	align-items: center;
}

.v-button.full-width {
	display: flex;
	min-width: 100%;
}

.button {
	position: relative;
	display: flex;
	align-items: center;
	width: var(--v-button-width);
	min-width: var(--v-button-min-width);
	height: var(--v-button-height);
	padding: 0 19px;
	color: var(--v-button-color);
	font-weight: var(--v-button-font-weight);
	font-size: var(--v-button-font-size);
	line-height: var(--v-button-line-height);
	text-decoration: none;
	background-color: var(--v-button-background-color);
	border: var(--border-width) solid var(--v-button-background-color);
	border-radius: var(--border-radius);
	cursor: pointer;
	transition: var(--fast) var(--transition);
	transition-property: background-color border;
}

.button:focus,
.button:hover {
	color: var(--v-button-color-hover);
	background-color: var(--v-button-background-color-hover);
	border-color: var(--v-button-background-color-hover);
}

.align-left {
	justify-content: flex-start;
}

.align-center {
	justify-content: center;
}

.align-right {
	justify-content: flex-end;
}

.button:focus {
	outline: 0;
}

.button:disabled {
	color: var(--v-button-color-disabled);
	background-color: var(--v-button-background-color-disabled);
	border: var(--border-width) solid var(--v-button-background-color-disabled);
	cursor: not-allowed;
}

.rounded,
.rounded .button {
	border-radius: 50%;
}

.outlined {
	--v-button-color: var(--v-button-background-color);

	background-color: transparent;
}

.outlined:not(.active):not(:disabled):focus,
.outlined:not(.active):not(:disabled):hover {
	color: var(--v-button-background-color-hover);
	background-color: transparent;
	border-color: var(--v-button-background-color-hover);
}

.outlined.secondary {
	--v-button-color: var(--foreground-subdued);
}

.outlined.active {
	background-color: var(--v-button-background-color);
}

.dashed {
	border-style: dashed;
}

.x-small {
	--v-button-height: 28px;
	--v-button-font-size: 12px;
	--v-button-font-weight: 600;
	--v-button-min-width: 60px;
	--border-radius: 4px;

	padding: 0 12px;
}

.small {
	--v-button-height: 36px;
	--v-button-font-size: 14px;
	--v-button-min-width: 120px;

	padding: 0 12px;
}

.large {
	--v-button-height: 52px;
	--v-button-min-width: 154px;

	padding: 0 12px;
}

.x-large {
	--v-button-height: 60px;
	--v-button-font-size: 18px;
	--v-button-min-width: 180px;

	padding: 0 12px;
}

.icon {
	width: var(--v-button-height);
	min-width: 0;
	padding: 0;
}

.button.full-width {
	min-width: 100%;
}

.content,
.spinner {
	max-width: 100%;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.content {
	position: relative;
	display: flex;
	align-items: center;
	line-height: normal;
}

.content.invisible {
	opacity: 0;
}

.spinner {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}

.spinner .v-progress-circular {
	--v-progress-circular-color: var(--v-button-color);
	--v-progress-circular-background-color: transparent;
}

.active {
	--v-button-color: var(--v-button-color-active) !important;
	--v-button-color-hover: var(--v-button-color-active) !important;
	--v-button-background-color: var(--v-button-background-color-active) !important;
	--v-button-background-color-hover: var(--v-button-background-color-active) !important;
}

.tile {
	border-radius: 0;
}
</style>

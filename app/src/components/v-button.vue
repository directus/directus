<script setup lang="ts">
import { computed } from 'vue';
import { RouteLocationRaw, useRoute, useLink } from 'vue-router';
import { useSizeClass, useGroupable } from '@directus/composables';
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
	/** Remove padding / min-inline-size. Meant to be used with just an icon as content */
	icon?: boolean;
	/** Element type to be used */
	type?: string;
	/** Disables the button */
	disabled?: boolean;
	/** Show a circular progress bar */
	loading?: boolean;
	/** To what internal link the button should direct */
	to?: RouteLocationRaw;
	/** To what external link the button should direct */
	href?: string;
	/** Where to open the external link of the button */
	target?: string;
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
	/** Tooltip text to show on hover */
	tooltip?: string;
}

const props = withDefaults(defineProps<Props>(), {
	kind: 'normal',
	type: 'button',
	to: '',
	target: '_blank',
	align: 'center',
	/** Must be explicitly undefined */
	active: undefined,
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
			target: props.target,
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

<template>
	<div class="v-button" :class="{ secondary, warning, danger, 'full-width': fullWidth, rounded }">
		<slot name="prepend-outer" />
		<component
			:is="component"
			v-focus="autofocus"
			v-tooltip.bottom="tooltip"
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

<style scoped>
/*

	Available Variables:

		--v-button-width                      [auto]
		--v-button-height                     [44px]
		--v-button-color                      [var(--foreground-inverted)]
		--v-button-color-hover                [var(--foreground-inverted)]
		--v-button-color-active               [var(--foreground-inverted)]
		--v-button-color-disabled             [var(--theme--foreground-subdued)]
		--v-button-background-color           [var(--theme--primary)]
		--v-button-background-color-hover     [var(--theme--primary-accent)]
		--v-button-background-color-active    [var(--theme--primary)]
		--v-button-background-color-disabled  [var(--theme--background-normal)]
		--v-button-font-size                  [16px]
		--v-button-font-weight                [600]
		--v-button-line-height                [22px]
		--v-button-min-width                  [140px]
		--v-button-padding                    [0 19px]

*/

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
	--v-button-background-color: var(--theme--success);
	--v-button-background-color-hover: var(--success-125);
	--v-button-background-color-active: var(--theme--success);
}

.warning {
	--v-button-color: var(--white);
	--v-button-color-hover: var(--white);
	--v-button-background-color: var(--theme--warning);
	--v-button-background-color-hover: var(--warning-125);
	--v-button-background-color-active: var(--theme--warning);
}

.danger {
	--v-button-color: var(--white);
	--v-button-color-hover: var(--white);
	--v-button-background-color: var(--theme--danger);
	--v-button-background-color-hover: var(--danger-125);
	--v-button-background-color-active: var(--theme--danger);
}

.secondary {
	--v-button-color: var(--theme--foreground);
	--v-button-color-hover: var(--theme--foreground);
	--v-button-color-active: var(--theme--foreground);
	--v-button-background-color: var(--theme--background-normal);
	--v-button-background-color-hover: var(--theme--background-accent);
	--v-button-background-color-active: var(--theme--background-accent);
}

.secondary.rounded {
	--v-button-background-color: var(--theme--background-normal);
	--v-button-background-color-active: var(--theme--background-normal);
	--v-button-background-color-hover: var(--theme--background-accent);
}

.warning.rounded {
	--v-button-background-color: var(--warning-10);
	--v-button-color: var(--theme--warning);
	--v-button-background-color-hover: var(--warning-25);
	--v-button-color-hover: var(--theme--warning);
}

.danger.rounded {
	--v-button-background-color: var(--danger-10);
	--v-button-color: var(--theme--danger);
	--v-button-background-color-hover: var(--danger-25);
	--v-button-color-hover: var(--theme--danger);
}

.v-button {
	display: inline-flex;
	align-items: center;
}

.v-button.full-width {
	display: flex;
	min-inline-size: 100%;
}

.button {
	position: relative;
	display: flex;
	align-items: center;
	inline-size: var(--v-button-width, auto);
	min-inline-size: var(--v-button-min-width, 140px);
	block-size: var(--v-button-height, 44px);
	padding: var(--v-button-padding, 0 19px);
	color: var(--v-button-color, var(--foreground-inverted));
	font-weight: var(--v-button-font-weight, 600);
	font-size: var(--v-button-font-size, 16px);
	line-height: var(--v-button-line-height, 22px);
	text-decoration: none;
	background-color: var(--v-button-background-color, var(--theme--primary));
	border: var(--theme--border-width) solid var(--v-button-background-color, var(--theme--primary));
	border-radius: var(--theme--border-radius);
	cursor: pointer;
	transition: var(--fast) var(--transition);
	transition-property: background-color, border;
}

.button:hover {
	color: var(--v-button-color-hover, var(--foreground-inverted));
	background-color: var(--v-button-background-color-hover, var(--theme--primary-accent));
	border-color: var(--v-button-background-color-hover, var(--theme--primary-accent));
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

.button:disabled {
	color: var(--v-button-color-disabled, var(--theme--foreground-subdued));
	background-color: var(--v-button-background-color-disabled, var(--theme--background-normal));
	border: var(--theme--border-width) solid var(--v-button-background-color-disabled, var(--theme--background-normal));
	cursor: not-allowed;
}

.rounded,
.rounded .button {
	border-radius: 50%;
}

.outlined {
	--v-button-color: var(--v-button-background-color, var(--theme--primary));

	background-color: transparent;
}

.outlined:not(.active):not(:disabled):hover {
	color: var(--v-button-background-color-hover, var(--theme--primary-accent));
	background-color: transparent;
	border-color: var(--v-button-background-color-hover, var(--theme--primary-accent));
}

.outlined.secondary {
	--v-button-color: var(--theme--foreground-subdued);
}

.outlined.active {
	background-color: var(--v-button-background-color, var(--theme--primary));
}

.dashed {
	border-style: dashed;
}

.x-small {
	--v-button-height: 28px;
	--v-button-font-size: 12px;
	--v-button-min-width: 60px;

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
	inline-size: var(--v-button-height, 44px);
	min-inline-size: 0;
	padding: 0;
}

.button.full-width {
	min-inline-size: 100%;
}

.content,
.spinner {
	max-inline-size: 100%;
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
	inset-block-start: 50%;
	inset-inline-start: 50%;
	transform: translate(-50%, -50%);

	html[dir='rtl'] & {
		transform: translate(50%, -50%);
	}
}

.spinner .v-progress-circular {
	--v-progress-circular-color: var(--v-button-color, var(--foreground-inverted));
	--v-progress-circular-background-color: transparent;
}

.active {
	--v-button-color: var(--v-button-color-active, var(--foreground-inverted)) !important;
	--v-button-color-hover: var(--v-button-color-active, var(--foreground-inverted)) !important;
	--v-button-background-color: var(--v-button-background-color-active, var(--theme--primary)) !important;
	--v-button-background-color-hover: var(--v-button-background-color-active, var(--theme--primary)) !important;
}

.tile {
	border-radius: 0;
}
</style>

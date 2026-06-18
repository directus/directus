<script setup lang="ts">
import { useGroupable, useSizeClass } from '@directus/composables';
import { isEqual, isNil } from 'lodash';
import { computed } from 'vue';
import { RouteLocationRaw, useLink, useRoute } from 'vue-router';
import VProgressCircular from './v-progress-circular.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VMenu from '@/components/v-menu.vue';
import vFocus from '@/directives/focus';
import vTooltip from '@/directives/tooltip';

export interface VButtonProps {
	/** Automatically focuses on the button */
	autofocus?: boolean;
	/** Styling of the button */
	kind?: 'normal' | 'info' | 'success' | 'warning' | 'danger';
	/** Stretches the button to it's maximal width */
	fullWidth?: boolean;
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

export interface VButtonEmits {
	click: [value?: MouseEvent];
}

const props = withDefaults(defineProps<VButtonProps>(), {
	kind: 'normal',
	type: 'button',
	to: '',
	target: '_blank',
	align: 'center',
	/** Must be explicitly undefined */
	active: undefined,
});

const emit = defineEmits<VButtonEmits>();

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
	<div class="v-button" :class="{ secondary, warning, danger, 'full-width': fullWidth }">
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
					'has-split-menu': $slots['split-menu'],
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
					<VProgressCircular :x-small="xSmall" :small="small" indeterminate />
				</slot>
			</div>
		</component>

		<VMenu v-if="$slots['split-menu']" show-arrow>
			<template #activator="{ toggle: toggleSplitMenu, active: splitMenuActive }">
				<button
					type="button"
					class="split-menu-button"
					:class="[
						sizeClass,
						{
							active: splitMenuActive,
							outlined,
							dashed,
						},
						kind,
					]"
					:disabled="disabled"
					:aria-label="$t('aria.more_options')"
					@click.stop="toggleSplitMenu"
				>
					<VIcon name="keyboard_arrow_down" />
				</button>
			</template>

			<slot name="split-menu" />
		</VMenu>

		<slot name="append-outer" />
	</div>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

		--v-button-width                      [auto]
		--v-button-height                     [var(--button-height-default)]
		--v-button-color                      [var(--foreground-inverted)]
		--v-button-color-hover                [var(--foreground-inverted)]
		--v-button-color-active               [var(--foreground-inverted)]
		--v-button-color-disabled             [var(--theme--foreground-subdued)]
		--v-button-background-color           [var(--theme--primary)]
		--v-button-background-color-hover     [var(--theme--primary-accent)]
		--v-button-background-color-active    [var(--theme--primary-accent)]
		--v-button-background-color-disabled  [var(--theme--background-normal)]
		--v-button-font-size                  [0.875rem]
		--v-button-font-weight                [600]
		--v-button-line-height                [1.4286]
		--v-button-min-width                  [7.875rem]
		--v-button-padding                    [0 1.0625rem]

*/

.info {
	--v-button-color: var(--white);
	--v-button-color-hover: var(--white);
	--v-button-color-active: var(--white);
	--v-button-background-color: var(--blue);
	--v-button-background-color-hover: var(--blue-125);
	--v-button-background-color-active: var(--blue-125);
}

.success {
	--v-button-color: var(--white);
	--v-button-color-hover: var(--white);
	--v-button-color-active: var(--white);
	--v-button-background-color: var(--theme--success);
	--v-button-background-color-hover: var(--success-125);
	--v-button-background-color-active: var(--success-125);
}

.warning {
	--v-button-color: var(--white);
	--v-button-color-hover: var(--white);
	--v-button-color-active: var(--white);
	--v-button-background-color: var(--theme--warning);
	--v-button-background-color-hover: var(--warning-125);
	--v-button-background-color-active: var(--warning-125);
}

.danger {
	--v-button-color: var(--white);
	--v-button-color-hover: var(--white);
	--v-button-color-active: var(--white);
	--v-button-background-color: var(--theme--danger);
	--v-button-background-color-hover: var(--danger-125);
	--v-button-background-color-active: var(--danger-125);
}

.secondary {
	--v-button-color: var(--theme--foreground);
	--v-button-color-hover: var(--theme--foreground);
	--v-button-color-active: var(--theme--foreground);
	--v-button-background-color: var(--theme--background-normal);
	--v-button-background-color-hover: var(--theme--background-accent);
	--v-button-background-color-active: var(--theme--background-accent);
}

.v-button {
	display: inline-flex;
	align-items: center;
}

.v-button.full-width {
	display: flex;
	min-inline-size: 100%;
}

.button,
.split-menu-button {
	block-size: var(--v-button-height, var(--button-height-default));
	color: var(--v-button-color, var(--foreground-inverted));
	background-color: var(--v-button-background-color, var(--theme--primary));
	border: var(--theme--border-width) solid var(--v-button-background-color, var(--theme--primary));
	border-radius: var(--theme--border-radius);
	transition: var(--fast) var(--transition);
	transition-property: background-color, border, color;

	&:hover {
		color: var(--v-button-color-hover, var(--foreground-inverted));
		background-color: var(--v-button-background-color-hover, var(--theme--primary-accent));
		border-color: var(--v-button-background-color-hover, var(--theme--primary-accent));
	}
}

.button {
	position: relative;
	display: flex;
	align-items: center;
	inline-size: var(--v-button-width, auto);
	min-inline-size: var(--v-button-min-width, 6.25rem);
	padding: var(--v-button-padding, 0 1rem);
	font-weight: var(--v-button-font-weight, 600);
	font-size: var(--v-button-font-size, 0.875rem);
	line-height: var(--v-button-line-height, 1.4286);
	text-decoration: none;
	cursor: pointer;

	&.has-split-menu {
		border-start-end-radius: 0;
		border-end-end-radius: 0;
	}
}

.split-menu-button {
	inline-size: var(--v-button-height, var(--button-height-default));
	margin-inline-start: 1px; /* stylelint-disable-line unit-disallowed-list -- hairline */

	&,
	&:focus-visible {
		border-start-start-radius: 0;
		border-end-start-radius: 0;
	}

	&:hover,
	&:focus-visible {
		z-index: 1;
	}

	&.outlined,
	&.dashed {
		margin-inline-start: calc(-1 * var(--theme--border-width));
	}
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

.button:disabled,
.split-menu-button:disabled {
	color: var(--v-button-color-disabled, var(--theme--foreground-subdued));
	background-color: var(--v-button-background-color-disabled, var(--theme--background-normal));
	border: var(--theme--border-width) solid var(--v-button-background-color-disabled, var(--theme--background-normal));
	cursor: not-allowed;
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
	&.button,
	&.split-menu-button {
		--v-button-height: var(--button-height-xs);
	}

	&.button {
		--v-button-font-size: 0.6875rem;
		--v-button-min-width: 3.375rem;
		--v-button-padding: 0 0.625rem;
	}
}

.small {
	&.button,
	&.split-menu-button {
		--v-button-height: var(--button-height-sm);
	}

	&.button {
		--v-button-font-size: 0.8125rem;
		--v-button-min-width: 5rem;
		--v-button-padding: 0 1rem;
	}
}

.large {
	&.button,
	&.split-menu-button {
		--v-button-height: var(--button-height-lg);
	}

	&.button {
		--v-button-min-width: 8.6875rem;
		--v-button-padding: 0 1.25rem;
	}
}

.x-large {
	&.button,
	&.split-menu-button {
		--v-button-height: var(--button-height-xl);
	}

	&.button {
		--v-button-font-size: 1rem;
		--v-button-min-width: 10.125rem;
		--v-button-padding: 0 1.5rem;
	}
}

.button.icon {
	inline-size: var(--v-button-height, var(--button-height-default));
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
	&.button,
	&.split-menu-button {
		--v-button-color: var(--v-button-color-active, var(--foreground-inverted));
		--v-button-color-hover: var(--v-button-color-active, var(--foreground-inverted));
		--v-button-background-color: var(--v-button-background-color-active, var(--theme--primary-accent));
		--v-button-background-color-hover: var(--v-button-background-color-active, var(--v-button-background-color));
	}
}

.tile {
	border-radius: 0;
}
</style>

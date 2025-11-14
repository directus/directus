<script setup lang="ts">
import { useGroupable } from '@directus/composables';
import { isMatch } from 'lodash';
import { computed } from 'vue';
import { RouteLocation, useLink, useRoute } from 'vue-router';

interface Props {
	block?: boolean;
	/** Makes the item height grow, if 'block' is enabled */
	grow?: boolean;
	/** Makes the item smaller */
	dense?: boolean;
	/** Where the item should link to */
	to?: string | RouteLocation;
	/** Same as to except that it takes an external link */
	href?: string;
	/** Disables the item */
	disabled?: boolean;
	/** Set the non-editable state for the input */
	nonEditable?: boolean;
	/** If the item should be clickable */
	clickable?: boolean;
	/** If the item should be active or not */
	active?: boolean;
	/** Adds a dashed style */
	dashed?: boolean;
	/** Renders an active state if the route matches exactly */
	exact?: boolean;
	/** Renders an active state it the route matches the query  */
	query?: boolean;
	/** Signal that the target link is a downloadable file */
	download?: string;
	/** What value to represent when active */
	value?: number | string;
	/** If the item is inside the navigation */
	nav?: boolean;
	/** Only matches to a group when both scopes are the same */
	scope?: string;
	/** Only matches when used as an activator for a group */
	activator?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	block: false,
	grow: false,
	dense: false,
	to: '',
	href: undefined,
	disabled: false,
	nonEditable: false,
	clickable: false,
	active: undefined,
	dashed: false,
	exact: false,
	query: false,
	download: undefined,
	value: undefined,
	nav: false,
	scope: 'v-list',
});

const emit = defineEmits(['click']);

const route = useRoute();

const { route: linkRoute, isActive, isExactActive } = useLink(props);

const component = computed(() => {
	if (props.to) return 'router-link';
	if (props.href) return 'a';
	if (!props.activator && props.clickable) return 'button';
	return 'li';
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

	if (component.value === 'button') {
		return {
			type: 'button',
			disabled: props.disabled,
		};
	}

	return {};
});

useGroupable({
	value: props.value,
	group: props.scope,
});

const isLink = computed(() => Boolean(props.to || props.href || props.clickable));

const isActiveRoute = computed(() => {
	if (props.active !== undefined) return props.active;

	if (props.to) {
		const queryMatch = Object.values(linkRoute.value.query).length
			? isMatch(route.query, linkRoute.value.query)
			: !Object.values(route.query).length;

		const isQueryActive = !props.query || queryMatch;

		if (!props.exact) {
			return isActive.value && isQueryActive;
		} else {
			return isExactActive.value && isQueryActive;
		}
	}

	return false;
});

function onClick(event: PointerEvent) {
	if (props.disabled === true) return;
	emit('click', event);
}
</script>

<template>
	<component
		:is="component"
		class="v-list-item"
		:class="{
			active: isActiveRoute,
			grow,
			dense,
			link: isLink,
			disabled,
			dashed,
			block,
			nav,
			clickable,
		}"
		:download="download"
		v-bind="additionalProps"
		@click="onClick"
	>
		<slot />
	</component>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

		--v-list-item-padding                  [0 8px 0 calc(8px + var(--v-list-item-indent, 0px))]
		--v-list-item-margin                   [2px 0]
		--v-list-item-min-height               [32px]
		--v-list-item-border-radius            [var(--theme--border-radius)]
		--v-list-item-border-color             [var(--theme--border-color-subdued)]
		--v-list-item-border-color-hover       [var(--theme--form--field--input--border-color-hover)]
		--v-list-item-color                    [var(--v-list-color, var(--theme--foreground))]
		--v-list-item-color-hover              [var(--v-list-color-hover, var(--theme--foreground))]
		--v-list-item-color-active             [var(--v-list-color-active, var(--theme--foreground))]
		--v-list-item-background-color         [var(--v-list-background-color, var(--theme--background-normal))]
		--v-list-item-background-color-hover   [var(--v-list-background-color-hover, var(--theme--background-normal))]
		--v-list-item-background-color-active  [var(--v-list-background-color-active, var(--theme--background-normal))]

*/

.v-list-item {
	--focus-ring-offset: var(--focus-ring-offset-invert);

	$this: &;

	position: relative;
	display: flex;
	flex: 1 1 100%;
	align-items: center;
	inline-size: 100%;
	min-inline-size: 0;
	max-inline-size: none;
	min-block-size: var(--v-list-item-min-height, 32px);
	max-block-size: none;
	margin: var(--v-list-item-margin, 2px 0);
	padding: var(--v-list-item-padding, 0 8px 0 calc(8px + var(--v-list-item-indent, 0px)));
	overflow: hidden;
	color: var(--v-list-item-color, var(--v-list-color, var(--theme--foreground)));
	text-align: start;
	text-decoration: none;
	border-radius: var(--v-list-item-border-radius, var(--theme--border-radius));
	background-color: var(--v-list-item-background-color, var(--v-list-background-color, transparent));

	&.dashed {
		&::after {
			/* Borders normally render outside the element, this is a way of showing it as inner */
			position: absolute;
			inset-block-start: 0;
			inset-inline-start: 0;
			inline-size: calc(100% - 4px);
			block-size: calc(100% - 4px);
			border: var(--theme--border-width) dashed var(--theme--form--field--input--border-color);
			content: '';
			pointer-events: none;
		}
	}

	&.link {
		cursor: pointer;
		transition: var(--fast) var(--transition);
		transition-property: background-color, color;

		&:not(.disabled):not(.dense):not(.block):hover {
			color: var(--v-list-item-color-hover, var(--v-list-color-hover, var(--theme--foreground)));
			background-color: var(
				--v-list-item-background-color-hover,
				var(--v-list-background-color-hover, var(--theme--background-normal))
			);

			&.active {
				color: var(
					--v-list-item-color-active-hover,
					var(--v-list-item-color-hover, var(--v-list-color-hover, var(--theme--foreground)))
				);
				background-color: var(
					--v-list-item-background-color-active-hover,
					var(
						--v-list-item-background-color-hover,
						var(--v-list-background-color-hover, var(--theme--background-normal))
					)
				);
			}
		}

		&:not(.disabled):not(.dense):not(.block):active {
			color: var(--v-list-item-color-active, var(--v-list-color-active, var(--theme--foreground)));
			background-color: var(
				--v-list-item-background-color-active,
				var(--v-list-background-color-active, var(--theme--background-normal))
			);
		}
	}

	&:not(.dense).active {
		color: var(--v-list-item-color-active, var(--v-list-color-active, var(--theme--foreground)));
		background-color: var(
			--v-list-item-background-color-active,
			var(--v-list-background-color-active, var(--theme--background-normal))
		);
	}

	&.disabled {
		--v-list-item-color: var(--form--field--input--disabled--foreground, var(--theme--foreground-subdued)) !important;

		cursor: var(--form--field--disabled--cursor, not-allowed);
	}

	&.dense {
		:deep(.v-text-overflow) {
			color: var(--theme--foreground);
		}

		&:hover,
		&.active {
			:deep(.v-text-overflow) {
				color: var(--theme--primary);
			}
		}
	}

	&.block {
		--v-icon-color: var(--v-icon-color, var(--theme--foreground-subdued));

		padding: var(
			--v-list-item-padding,
			calc(var(--theme--form--field--input--padding) / 2) var(--theme--form--field--input--padding)
		);
		position: relative;
		display: flex;
		block-size: var(--theme--form--field--input--height);
		margin: 0;
		background-color: var(
			--v-list-item-background-color,
			var(--v-list-background-color, var(--theme--form--field--input--background))
		);
		border: var(--theme--border-width) solid
			var(--v-list-item-border-color, var(--theme--form--field--input--border-color));
		border-radius: var(--theme--border-radius);
		transition: var(--fast) var(--transition);
		transition-property: background-color, border-color;

		:slotted(.drag-handle) {
			cursor: grab;

			&:hover {
				color: var(--foreground-color);
			}
		}

		:slotted(.drag-handle:active) {
			cursor: grabbing;
		}

		:slotted(.spacer) {
			flex-grow: 1;
		}

		&.clickable:hover:not(.disabled) {
			background-color: var(
				--v-list-item-background-color-hover,
				var(--v-list-background-color-hover, var(--theme--form--field--input--background))
			);
			border: var(--theme--border-width) solid
				var(--v-list-item-border-color-hover, var(--theme--form--field--input--border-color-hover));
		}

		&.sortable-chosen {
			border: var(--theme--border-width) solid var(--theme--primary) !important;
		}

		&.sortable-ghost {
			pointer-events: none;
		}

		& + & {
			margin-block-start: var(--v-list-item-margin, 8px);
		}

		&.grow {
			block-size: auto;
			min-block-size: var(--theme--form--field--input--height);
		}

		&.dense {
			--theme--form--field--input--height: 44px;
			padding: calc(var(--theme--form--field--input--padding) / 4) calc(var(--theme--form--field--input--padding) / 2);

			& + & {
				margin-block-start: var(--v-list-item-margin, 4px);
			}
		}
	}

	@at-root {
		.v-list.nav {
			#{$this}:not(.dense) {
				--v-list-item-min-height: 36px;
				--v-list-item-border-radius: 4px;

				margin: 2px 0;
				padding: 0 8px;

				&:first-child {
					margin-block-start: 0;
				}

				&:last-child {
					margin-block-end: 0;
				}

				&:only-child {
					margin-block: 0;
				}
			}
		}

		.v-list.nav.dense {
			#{$this}:not(.dense) {
				--v-list-item-min-height: 32px;
			}
		}
	}
}
</style>

<template>
	<component
		:is="component"
		class="v-list-item"
		:class="{
			active: isActiveRoute,
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

<script setup lang="ts">
import { RouteLocation, useLink, useRoute } from 'vue-router';
import { computed } from 'vue';
import { useGroupable } from '@directus/shared/composables';
import { isEqual } from 'lodash';

interface Props {
	block?: boolean;
	/** Makes the item smaller */
	dense?: boolean;
	/** Where the item should link to */
	to?: string | RouteLocation;
	/** Same as to except that it takes an external link */
	href?: string;
	/** Disables the item */
	disabled?: boolean;
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
}

const props = withDefaults(defineProps<Props>(), {
	block: false,
	dense: false,
	to: '',
	href: undefined,
	disabled: false,
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
		const isQueryActive = !props.query || isEqual(route.query, linkRoute.value.query);

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

<style>
body {
	--v-list-item-padding-nav: 0 var(--input-padding);
	--v-list-item-padding: 0 var(--input-padding) 0 calc(var(--input-padding) + var(--v-list-item-indent, 0px));
	--v-list-item-margin-nav: 2px 0;
	--v-list-item-margin: 2px 0;
	--v-list-item-min-width: none;
	--v-list-item-max-width: none;
	--v-list-item-min-height-nav: 36px;
	--v-list-item-min-height: 32px;
	--v-list-item-max-height: auto;
	--v-list-item-border-radius: var(--border-radius);
	--v-list-item-border-color: var(--border-subdued);
	--v-list-item-border-color-hover: var(--border-normal-alt);
	--v-list-item-color: var(--v-list-color, var(--foreground-normal));
	--v-list-item-color-hover: var(--v-list-color-hover, var(--foreground-normal));
	--v-list-item-color-active: var(--v-list-color-active, var(--foreground-normal));
	--v-list-item-background-color-hover: var(--v-list-background-color-hover, var(--background-normal));
	--v-list-item-background-color-active: var(--v-list-background-color-active, var(--background-normal));
}
</style>

<style lang="scss" scoped>
.v-list-item {
	$this: &;

	position: relative;
	display: flex;
	flex-basis: 100%;
	flex-grow: 1;
	flex-shrink: 1;
	align-items: center;
	min-width: var(--v-list-item-min-width);
	max-width: var(--v-list-item-max-width);
	min-height: var(--v-list-item-min-height);
	max-height: var(--v-list-item-max-height);
	margin: var(--v-list-item-margin);
	padding: var(--v-list-item-padding);
	overflow: hidden;
	color: var(--v-list-item-color);
	text-decoration: none;
	border-radius: var(--v-list-item-border-radius);

	&.dashed {
		&::after {
			/* Borders normally render outside the element, this is a way of showing it as inner */
			position: absolute;
			top: 0;
			left: 0;
			width: calc(100% - 4px);
			height: calc(100% - 4px);
			border: 2px dashed var(--border-normal);
			content: '';
			pointer-events: none;
		}
	}

	&.link {
		cursor: pointer;
		transition: var(--fast) var(--transition);
		transition-property: background-color, color;
		user-select: none;

		&:not(.disabled):not(.dense):not(.block):hover {
			color: var(--v-list-item-color-hover);
			background-color: var(--v-list-item-background-color-hover);
		}

		&:not(.disabled):not(.dense):not(.block):active {
			color: var(--v-list-item-color-active);
			background-color: var(--v-list-item-background-color-active);
		}
	}

	&:not(.dense).active {
		color: var(--v-list-item-color-active);
		background-color: var(--v-list-item-background-color-active);
	}

	&.disabled {
		--v-list-item-color: var(--foreground-subdued) !important;

		cursor: not-allowed;
	}

	&.dense {
		:deep(.v-text-overflow) {
			color: var(--foreground-normal);
		}

		&:hover,
		&.active {
			:deep(.v-text-overflow) {
				color: var(--primary);
			}
		}
	}

	&.block {
		--v-list-item-border-color: var(--border-subdued);
		--v-list-item-background-color: var(--background-page);
		--v-list-item-background-color-hover: var(--card-face-color);
		--v-icon-color: var(--foreground-subdued);

		position: relative;
		display: flex;
		height: var(--input-height);
		margin: 0;
		padding: 8px var(--input-padding);
		background-color: var(--v-list-item-background-color);
		border: var(--border-width) solid var(--v-list-item-border-color);
		border-radius: var(--border-radius);
		transition: border-color var(--fast) var(--transition);

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

		&.clickable:hover {
			background-color: var(--v-list-item-background-color-hover);
			border: var(--border-width) solid var(--v-list-item-border-color-hover);
		}

		&.sortable-chosen {
			border: var(--border-width) solid var(--primary) !important;
		}

		&.sortable-ghost {
			pointer-events: none;
		}

		& + & {
			margin-top: 8px;
		}

		&.dense {
			height: 44px;
			padding: 4px 8px;

			& + & {
				margin-top: 4px;
			}
		}
	}

	@at-root {
		.v-list.nav {
			#{$this}:not(.dense) {
				--v-list-item-min-height: var(--v-list-item-min-height-nav);
				--v-list-item-border-radius: 4px;

				margin: var(--v-list-item-margin-nav);
				padding: var(--v-list-item-padding-nav);

				&:first-child {
					margin-top: 0;
				}

				&:last-child {
					margin-bottom: 0;
				}

				&:only-child {
					margin-top: 0;
					margin-bottom: 0;
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

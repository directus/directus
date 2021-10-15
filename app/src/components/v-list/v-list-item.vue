<template>
	<component
		:is="component"
		class="v-list-item"
		:to="to !== '' ? to : undefined"
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
		:href="href"
		:download="download"
		:target="component === 'a' ? '_blank' : undefined"
		@click="onClick"
	>
		<slot />
	</component>
</template>

<script lang="ts">
import { RouteLocation, useLink, useRoute } from 'vue-router';
import { defineComponent, PropType, computed } from 'vue';
import { useGroupable } from '@/composables/groupable';
import { isEqual } from 'lodash';

export default defineComponent({
	props: {
		block: {
			type: Boolean,
			default: false,
		},
		dense: {
			type: Boolean,
			default: false,
		},
		to: {
			type: [String, Object] as PropType<string | RouteLocation>,
			default: '',
		},
		href: {
			type: String,
			default: undefined,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		clickable: {
			type: Boolean,
			default: false,
		},
		active: {
			type: Boolean,
			default: undefined,
		},
		dashed: {
			type: Boolean,
			default: false,
		},
		exact: {
			type: Boolean,
			default: false,
		},
		query: {
			type: Boolean,
			default: false,
		},
		download: {
			type: String,
			default: undefined,
		},
		value: {
			type: [String, Number],
			default: undefined,
		},
		nav: {
			type: Boolean,
			default: false,
		},
		scope: {
			type: String,
			default: 'v-list',
		},
	},
	emits: ['click'],
	setup(props, { emit }) {
		const route = useRoute();

		const { route: linkRoute, isActive, isExactActive } = useLink(props);

		const component = computed(() => {
			if (props.to) return 'router-link';
			if (props.href) return 'a';
			return 'li';
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

		return { component, isLink, isActiveRoute, onClick };

		function onClick(event: PointerEvent) {
			if (props.disabled === true) return;
			emit('click', event);
		}
	},
});
</script>

<style>
body {
	--v-list-item-padding-nav: 0 8px;
	--v-list-item-padding: 0 8px 0 calc(8px + var(--v-list-item-indent, 0px));
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
			// Borders normally render outside the element, this is a way of showing it as inner
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
		padding: 8px;
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

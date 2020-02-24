<template>
	<component
		:is="component"
		active-class="active"
		class="v-list-item"
		:to="to"
		:class="{ dense, link: isClickable }"
		v-on="$listeners"
	>
		<slot></slot>
	</component>
</template>

<script lang="ts">
import { Location } from 'vue-router';
import { createComponent, PropType, computed } from '@vue/composition-api';

export default createComponent({
	props: {
		dense: {
			type: Boolean,
			default: false
		},
		to: {
			type: [String, Object] as PropType<string | Location>,
			default: null
		}
	},
	setup(props, { listeners }) {
		const component = computed<string>(() => (props.to ? 'router-link' : 'li'));
		const isClickable = computed(() => Boolean(props.to || listeners.click !== undefined));
		return { component, isClickable };
	}
});
</script>

<style lang="scss" scoped>
.v-list-item {
	--v-list-item-padding: 0 16px;
	--v-list-item-min-width: none;
	--v-list-item-max-width: none;
	--v-list-item-min-height: 48px;
	--v-list-item-max-height: auto;
	--v-list-item-border-radius: 0;
	--v-list-item-margin-bottom: 0;
	--v-list-item-color: var(--v-list-color, var(--foreground-color));
	--v-list-item-color-hover: var(--v-list-color-hover, var(--foreground-color));
	--v-list-item-color-active: var(--v-list-color-active, var(--foreground-color));
	--v-list-item-background-color: var(--v-list-background-color, var(--background-color));
	--v-list-item-background-color-hover: var(
		---list-background-color-hover,
		var(--hover-background)
	);
	--v-list-item-background-color-active: var(
		--vlist-background-color-active,
		var(--active-background)
	);

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
	margin-bottom: var(--v-list-item-margin-bottom);
	padding: var(--v-list-item-padding);
	overflow: hidden;
	color: var(--v-list-item-color);
	text-decoration: none;
	background-color: var(--v-list-item-background-color);
	border-radius: var(--v-list-item-border-radius);

	&.link {
		cursor: pointer;
		transition: var(--fast) var(--transition);
		transition-property: background-color, color;
		user-select: none;

		&:hover {
			color: var(--v-list-item-color-hover);
			background-color: var(--v-list-item-background-color-hover);
		}

		&:active,
		&.active {
			color: var(--v-list-item-color-active);
			background-color: var(--v-list-item-background-color-active);
		}
	}

	.v-list.dense &,
	&.dense {
		--v-list-item-min-height: 40px;
	}

	.v-list.nav & {
		--v-list-item-padding: 0 8px;
		--v-list-item-border-radius: 4px;

		&:not(:last-child):not(:only-child) {
			--v-list-item-margin-bottom: 8px;
		}

		.v-list.dense &,
		&.dense {
			&:not(:last-child):not(:only-child) {
				--v-list-item-margin-bottom: 4px;
			}
		}
	}
}
</style>

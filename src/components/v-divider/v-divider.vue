<template>
	<div class="v-divider" :class="{ vertical }">
		<span v-if="!vertical && $slots.default"><slot /></span>
		<hr role="separator" :aria-orientation="vertical ? 'vertical' : 'horizontal'" />
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	props: {
		vertical: {
			type: Boolean,
			default: false,
		},
	},
});
</script>

<style lang="scss" scoped>
.v-divider {
	--v-divider-color: var(--border-normal);
	--v-divider-label-color: var(--foreground-subdued);

	display: flex;
	flex-basis: 0px;
	flex-grow: 1;
	flex-shrink: 1;
	align-items: center;
	overflow: visible;

	hr {
		flex-grow: 1;
		max-width: 100%;
		border: solid;
		border-color: var(--v-divider-color);
		border-width: 2px 0 0 0;
	}

	span {
		margin-right: 16px;
		color: var(--v-divider-label-color);
		font-size: 16px;
	}

	&.vertical {
		display: inline-flex;
		align-self: stretch;

		hr {
			width: 0px;
			max-width: 0px;
			height: inherit;
			border-width: 0 2px 0 0;
		}
	}
}
</style>

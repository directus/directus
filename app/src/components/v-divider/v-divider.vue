<template>
	<div class="v-divider" :class="{ vertical, inlineTitle, large }">
		<span v-if="$slots.icon || $slots.default" class="wrapper">
			<slot name="icon" class="icon" />
			<span v-if="!vertical && $slots.default" class="type-text"><slot /></span>
		</span>
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
		inlineTitle: {
			type: Boolean,
			default: true,
		},
		large: {
			type: Boolean,
			default: false,
		},
	},
});
</script>

<style>
body {
	--v-divider-color: var(--border-normal);
	--v-divider-label-color: var(--foreground-normal-alt);
}
</style>

<style lang="scss" scoped>
.v-divider {
	flex-basis: 0px;
	flex-grow: 1;
	flex-shrink: 1;
	flex-wrap: wrap;
	align-items: center;
	overflow: visible;

	hr {
		flex-grow: 1;
		order: 1;
		max-width: 100%;
		margin-top: 8px;
		border: solid;
		border-color: var(--v-divider-color);
		border-width: 2px 0 0 0;
	}

	span.wrapper {
		display: flex;
		margin-right: 16px;
		color: var(--v-divider-label-color);

		.v-icon {
			margin-right: 4px;
			transform: translateY(-1px);
		}
	}

	.type-text {
		transition: color var(--fast) var(--transition);
		font-weight: 600;
		color: var(--v-divider-label-color);
	}

	&.large .type-text {
		font-weight: 700;
		font-size: 24px;
	}

	&.inlineTitle {
		display: flex;

		span.wrapper {
			order: 0;
			margin-right: 8px;
			font-weight: 600;
			font-size: 14px;
		}

		hr {
			margin: 0;
		}
	}

	&.vertical {
		display: inline-flex;
		flex-direction: column;
		align-self: stretch;
		height: 100%;

		hr {
			width: 0px;
			max-width: 0px;
			border-width: 0 2px 0 0;
		}

		span.wrapper {
			order: 0;
			margin: 0 0 8px;
		}
	}
}
</style>

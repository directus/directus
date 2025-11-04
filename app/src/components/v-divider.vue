<script setup lang="ts">
interface Props {
	/** Render the divider vertically */
	vertical?: boolean;
	/** Render the title inline with the divider, or under it */
	inlineTitle?: boolean;
	/** Renders a larger divider text */
	large?: boolean;
}

withDefaults(defineProps<Props>(), {
	vertical: false,
	inlineTitle: true,
	large: false,
});
</script>

<template>
	<div class="v-divider" :class="{ vertical, inlineTitle, large }">
		<span v-if="$slots.icon || $slots.default" class="wrapper">
			<slot name="icon" class="icon" />
			<span v-if="!vertical && $slots.default" class="type-text"><slot /></span>
		</span>
		<hr :aria-orientation="vertical ? 'vertical' : 'horizontal'" />
	</div>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

		--v-divider-color        [var(--theme--form--field--input--border-color)]
		--v-divider-label-color  [var(--theme--foreground-accent)]
		--v-divider-thickness    [var(--theme--border-width)]

*/

.v-divider {
	flex: 1 1 0;
	flex-wrap: wrap;
	align-items: center;
	overflow: visible;

	hr {
		flex-grow: 1;
		order: 1;
		max-inline-size: 100%;
		margin-block-start: 8px;
		border: solid;
		border-color: var(--v-divider-color, var(--theme--form--field--input--border-color));
		border-width: var(--v-divider-thickness, var(--theme--border-width)) 0 0 0;
	}

	span.wrapper {
		display: flex;
		color: var(--v-divider-label-color, var(--theme--foreground-accent));

		:slotted(.v-icon) {
			margin-inline-end: 4px;
			transform: translateY(-1px);
		}
	}

	.type-text {
		inline-size: 100%;
		color: var(--v-divider-label-color, var(--theme--foreground-accent));
		font-weight: 600;
		transition: color var(--fast) var(--transition);
	}

	&.large .type-text {
		font-size: 24px;
		font-weight: var(--theme--fonts--display--font-weight);
		font-family: var(--theme--fonts--display--font-family);
	}

	&.inlineTitle {
		display: flex;

		span.wrapper {
			order: 0;
			margin-inline-end: 8px;
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
		block-size: 100%;

		hr {
			inline-size: 0;
			max-inline-size: 0;
			border-width: 0 var(--theme--border-width) 0 0;
		}

		span.wrapper {
			order: 0;
			margin: 0 0 8px;
		}
	}
}
</style>

<template>
	<div class="v-divider" :class="{ vertical, inlineTitle, large }">
		<span v-if="$slots.icon || $slots.default" class="wrapper">
			<slot name="icon" class="icon" />
			<span v-if="!vertical && $slots.default" class="type-text"><slot /></span>
		</span>
		<hr role="separator" :aria-orientation="vertical ? 'vertical' : 'horizontal'" />
	</div>
</template>

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
		border-width: var(--border-width) 0 0 0;
	}

	span.wrapper {
		display: flex;
		color: var(--v-divider-label-color);

		:slotted(.v-icon) {
			margin-right: 4px;
			transform: translateY(-1px);
		}
	}

	.type-text {
		width: 100%;
		color: var(--v-divider-label-color);
		font-weight: 600;
		transition: color var(--fast) var(--transition);
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
			border-width: 0 var(--border-width) 0 0;
		}

		span.wrapper {
			order: 0;
			margin: 0 0 8px;
		}
	}
}
</style>

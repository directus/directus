<script setup lang="ts">
interface Props {
	/** Disables any interactions with the card */
	disabled?: boolean;
	/** Render without rounded corners */
	tile?: boolean;
}

withDefaults(defineProps<Props>(), {
	disabled: false,
	tile: false,
});
</script>

<template>
	<div class="v-card" :class="{ disabled, tile }">
		<slot />
	</div>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

		--v-card-min-width         [none]
		--v-card-padding           [16px]
		--v-card-background-color  [var(--theme--form--field--input--background-subdued)]

*/

.v-card {
	--theme--form--row-gap: 52px;

	min-inline-size: var(--v-card-min-width, none);
	max-inline-size: 400px;
	block-size: auto;
	max-block-size: 90vh;
	overflow: auto;

	/* Page Content Spacing */
	font-size: 15px;
	line-height: 24px;
	background-color: var(--v-card-background-color, var(--theme--form--field--input--background-subdued));
	border-radius: var(--theme--border-radius);

	& > :first-child {
		border-start-start-radius: var(--theme--border-radius);
		border-start-end-radius: var(--theme--border-radius);
	}

	&.disabled {
		cursor: not-allowed;
		pointer-events: none;

		& :deep(> *) {
			opacity: 0.4;
		}
	}

	&.tile {
		border-radius: 0;
	}
}
</style>

<template>
	<div class="v-card" :class="{ disabled, tile }">
		<slot />
	</div>
</template>

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

<style>
body {
	--v-card-min-width: none;
	--v-card-max-width: 400px;
	--v-card-height: auto;
	--v-card-min-height: none;
	--v-card-max-height: 90vh;
	--v-card-padding: 16px;
	--v-card-background-color: var(--background-subdued);
}
</style>

<style lang="scss" scoped>
.v-card {
	--border-radius: 6px;
	--input-height: 60px;
	--input-padding: 16px; /* (60 - 4 - 24) / 2 */
	--form-vertical-gap: 52px;

	min-width: var(--v-card-min-width);
	max-width: var(--v-card-max-width);
	height: var(--v-card-height);
	min-height: var(--v-card-min-height);
	max-height: var(--v-card-max-height);
	overflow: auto;

	/* Page Content Spacing */
	font-size: 15px;
	line-height: 24px;
	background-color: var(--v-card-background-color);
	border-radius: var(--border-radius);

	& > :first-child {
		border-top-left-radius: var(--border-radius);
		border-top-right-radius: var(--border-radius);
	}

	&.disabled {
		cursor: not-allowed;
		pointer-events: none;

		& > * {
			opacity: 0.4;
		}
	}

	&.tile {
		border-radius: 0;
	}
}
</style>

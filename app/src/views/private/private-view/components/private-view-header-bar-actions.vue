<template>
	<div class="actions-container">
		<slot name="prepend" />
		<div class="actions">
			<slot />
		</div>
		<slot name="append" />
	</div>
</template>

<style scoped>
@media (width <= 640px) {
	.actions-container {
		position: fixed;
		inline-size: 100%;
		inset-block-end: 0;
		inset-inline-start: 0;
		background-color: var(--theme--header--background);
		block-size: calc(var(--header-bar-height) + var(--theme--header--border-width));
		display: flex;
		align-items: center;
		padding-inline: var(--content-padding);
		justify-content: flex-end;
	}
}

@media (width > 640px) {
	.actions-container {
		display: contents;
	}
}

.actions {
	position: relative;
	display: flex;
	flex-shrink: 0;
	gap: 8px;
}

.actions .v-button.secondary {
	--v-icon-color: var(--theme--foreground);
}
</style>

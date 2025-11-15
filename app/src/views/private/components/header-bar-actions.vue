<template>
	<div class="actions">
		<slot />
	</div>
</template>

<style scoped>
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

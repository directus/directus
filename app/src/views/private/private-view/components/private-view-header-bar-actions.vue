<template>
	<slot name="prepend" />
	<div class="actions">
		<slot />
	</div>
	<slot name="append" />
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

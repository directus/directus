<template>
	<div class="v-card-actions"><slot /></div>
</template>

<style scoped>
.v-card-actions {
	display: flex;
	justify-content: flex-end;
	padding: var(--v-card-padding);
}

.v-card-actions > :slotted(.v-button + .v-button) {
	margin-left: 12px;
}
</style>

<template functional>
	<div class="v-card-actions"><slot /></div>
</template>

<style lang="scss" scoped>
.v-card-actions {
	display: flex;
	justify-content: flex-end;
	padding: var(--v-card-padding);

	& ::v-deep > .v-button + .v-button {
		margin-left: 12px;
	}
}
</style>

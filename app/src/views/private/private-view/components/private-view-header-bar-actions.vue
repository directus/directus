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
	gap: 0.125rem;
}
</style>

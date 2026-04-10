<template>
	<div class="prepend">
		<slot name="prepend" />
	</div>

	<div class="actions">
		<slot />
	</div>

	<slot name="append" />
</template>

<style scoped lang="scss">
.prepend {
	margin-inline-end: 0.625rem;

	&:empty {
		display: contents;
	}
}

.actions {
	position: relative;
	display: flex;
	flex-shrink: 0;
	gap: 0.125rem;
}
</style>

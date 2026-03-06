<template>
	<div class="v-card-title type-label"><slot /></div>
</template>

<style lang="scss" scoped>
.v-card-title {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	margin-block-start: 0.25rem;
	padding: var(--v-card-padding, 0.875rem);
	font-weight: 600;
	line-height: 1.6em;
}
</style>

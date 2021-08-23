<template>
	<div class="v-card-title type-label"><slot /></div>
</template>

<style lang="scss" scoped>
.v-card-title {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	margin-top: 4px;
	padding: var(--v-card-padding);
	font-weight: 600;
	line-height: 1.6em;
}
</style>

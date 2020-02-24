<template functional>
	<div class="v-list-item-content">
		<slot></slot>
	</div>
</template>

<style lang="scss" scoped>
.v-list-item-content {
	--v-list-item-content-padding: 12px 0;

	display: flex;
	flex-grow: 1;
	flex-shrink: 1;
	flex-wrap: wrap;
	align-items: center;
	align-self: center;
	padding: var(--v-list-item-content-padding);
	overflow: hidden;

	.v-list.dense &,
	.v-list-item.dense & {
		--v-list-item-content-padding: 8px 0;
	}
}
</style>

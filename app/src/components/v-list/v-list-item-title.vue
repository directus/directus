<template functional>
	<div class="v-list-item-title type-text">
		<slot></slot>
	</div>
</template>

<style lang="scss" scoped>
.v-list-item-title {
	flex-basis: 100%;
	flex-grow: 1;
	flex-shrink: 1;
	align-self: center;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>

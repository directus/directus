<template functional>
	<div class="v-list-item-title">
		<slot></slot>
	</div>
</template>

<style lang="scss" scoped>
@import '@/styles/mixins/type-styles';

.v-list-item-title {
	flex-basis: 100%;
	flex-grow: 1;
	flex-shrink: 1;
	align-self: center;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;

	.v-list.dense &,
	.v-list-item.dense & {
		@include type-item-title-dense;
	}
	@include type-item-title;
}
</style>

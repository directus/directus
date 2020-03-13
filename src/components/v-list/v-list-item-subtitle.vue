<template functional>
	<div class="v-list-item-subtitle">
		<slot></slot>
	</div>
</template>

<style lang="scss" scoped>
@import '@/styles/mixins/type-styles';

.v-list-item-subtitle {
	$this: &;

	flex-basis: 100%;
	flex-grow: 1;
	flex-shrink: 1;
	align-self: center;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;

	.v-list.dense &,
	.v-list-item.dense & {
		@include type-item-subtitle-dense;
	}

	@at-root {
		.v-list,
		.v-list-item,
		.v-list .v-list-item {
			&.one-line #{$this},
			&.two-line #{$this} {
				display: block;
				white-space: nowrap;
				-webkit-line-clamp: none;
				-webkit-box-orient: none;
			}
			&.three-line #{$this} {
				display: -webkit-box;
				white-space: initial;
				-webkit-line-clamp: 2;
				-webkit-box-orient: vertical;
			}
		}
	}

	@include type-item-subtitle;
}
</style>

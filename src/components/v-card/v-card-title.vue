<template functional>
	<div class="v-card-title"><slot /></div>
</template>

<style lang="scss" scoped>
@import '@/styles/mixins/type-styles';

.v-card-title {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	padding: var(--v-card-padding);
	word-break: break-all;

	@include type-card-title;
}
</style>

<template functional>
	<div class="v-card-text"><slot /></div>
</template>

<style lang="scss" scoped>
@import '@/styles/mixins/type-styles';

.v-card-text {
	padding: var(--v-card-padding);
	padding-top: 0;

	@include type-card-text;
}
</style>

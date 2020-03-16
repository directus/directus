<template function>
	<div class="v-card-subtitle"><slot /></div>
</template>

<style lang="scss" scoped>
@import '@/styles/mixins/type-styles';

.v-card-subtitle {
	margin-top: -16px;
	padding: 16px;
	padding-top: 0;

	@include type-card-subtitle;
}
</style>

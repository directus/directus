<template>
	<div class="container" v-show="searchQuery !== null || visible > 20">
		<v-input small class="search" v-model="searchQuery" :placeholder="$t('search_collection')">
			<template #prepend><v-icon small name="search" /></template>
		</v-input>
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { useSearch } from '../composables/use-search';

export default defineComponent({
	setup() {
		const { visible, searchQuery } = useSearch();

		return {
			visible,
			searchQuery,
		};
	},
});
</script>

<style lang="scss" scoped>
.container {
	position: sticky;
	top: 0px;
	left: 0px;
	z-index: 10;
	display: flex;
	align-items: center;
	width: 100%;
	height: 64px;
	padding: 0 12px;
	background-color: var(--background-normal);

	&::after {
		position: absolute;
		bottom: -2px;
		left: 12px;
		width: calc(100% - 24px);
		height: 2px;
		background-color: var(--border-normal);
		content: '';
	}
}

.v-input {
	height: 40px;

	::v-deep .input {
		border: none;
	}
}
</style>

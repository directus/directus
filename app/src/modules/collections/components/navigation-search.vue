<template>
	<div class="container" v-show="searchQuery !== null || visible > 30">
		<v-input small class="search" v-model="searchQuery" :placeholder="$t('search_collection')">
			<template #prepend><v-icon name="search" /></template>
		</v-input>
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { useSearch } from '../composables/use-search';

export default defineComponent({
	props: {
		exact: {
			type: Boolean,
			default: false,
		},
	},
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
	width: calc(100% - 24px);
	height: 64px;
	margin: 0 12px;
	background-color: var(--background-normal);
	border-bottom: 2px solid var(--border-normal);
}

.v-input {
	height: 40px;

	::v-deep .input {
		border: none;
	}
}
</style>

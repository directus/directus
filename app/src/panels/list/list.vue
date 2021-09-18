<template>
	<div class="list" :class="{ 'has-header': show_header, loading }">
		<v-progress-circular v-if="loading" indeterminate />
		<div v-else>
			<v-list>
				<v-list-item v-for="row in list" :key="row.id">
					<v-list-item-content class="selectable">
						<render-template :item="row" :collection="options.collection" :template="renderTemplate" />
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType, computed } from 'vue';
import api from '@/api';
import { isEqual } from 'lodash';
import { Filter } from '@directus/shared/types';

type ListOptions = {
	displayTemplate: string;
	sortField: string;
	sortDirection: 'asc' | 'desc';
	collection: string;
	limit: number;
	filter: Filter;
};

export default defineComponent({
	props: {
		options: {
			type: Object as PropType<ListOptions>,
			default: null,
		},
		show_header: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const list = ref<Record<string, any>[]>([]);
		const loading = ref(false);
		const error = ref();

		fetchData();

		watch(
			() => props.options,
			(newOptions, oldOptions) => {
				if (isEqual(newOptions, oldOptions)) return;
				fetchData();
			},
			{ deep: true }
		);

		const renderTemplate = computed(() => {
			return props.options.displayTemplate;
		});

		return { list, loading, renderTemplate };

		async function fetchData() {
			if (!props.options) return;

			loading.value = true;

			try {
				const sort = props.options.sortField;

				const res = await api.get(`/items/${props.options.collection}`, {
					params: {
						filter: props.options.filter,
						sort: props.options.sortDirection === 'desc' ? `-${sort}` : sort,
						limit: props.options.limit ?? 5,
					},
				});

				list.value = res.data.data;
			} catch (err) {
				error.value = err;
			} finally {
				loading.value = false;
			}
		}
	},
});
</script>

<style scoped>
.list {
	--v-list-item-border-radius: 0;
	--v-list-item-padding: 6px;

	height: 100%;
	padding: 0 12px;
	overflow-y: auto;
}

.list.loading {
	display: flex;
	align-items: center;
	justify-content: center;
}

.list.has-header {
	height: calc(100% - 16px);
}

.v-list-item {
	border-top: var(--border-width) solid var(--border-subdued);
}

.v-list-item:last-child {
	border-bottom: var(--border-width) solid var(--border-subdued);
}
</style>

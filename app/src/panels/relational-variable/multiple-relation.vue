<script setup lang="ts">
import { computed, toRefs } from 'vue';
import useDisplayItems from './use-display-items';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VNotice from '@/components/v-notice.vue';
import VRemove from '@/components/v-remove.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import RenderTemplate from '@/views/private/components/render-template.vue';

interface Props {
	value: (string | number)[];
	collection: string;
	template: string;
	filter: Record<string, any>;
	limit?: number;
}
const props = withDefaults(defineProps<Props>(), { limit: 5 });
const emit = defineEmits(['input', 'select']);

const { collection, template, value } = toRefs(props);

const { displayItems, displayTemplate, loading, primaryKey } = useDisplayItems(collection, template, value);
const totalItemCount = computed(() => displayItems.value?.length || 0);

function deleteItem(elem: Record<string, any>) {
	emit(
		'input',
		displayItems.value
			.filter((item) => item[primaryKey.value] !== elem[primaryKey.value])
			.map((item) => item[primaryKey.value]),
	);
}
</script>

<template>
	<div class="one-to-many">
		<template v-if="loading">
			<VSkeletonLoader v-for="n in limit" :key="n" type="block-list-item-dense" />
		</template>

		<VNotice v-else-if="displayItems.length === 0">
			{{ $t('no_items') }}
		</VNotice>

		<VList v-else>
			<VListItem v-for="element in displayItems" :key="element[primaryKey]" block :dense="displayItems.length > 4">
				<RenderTemplate :collection="collection" :item="element" :template="displayTemplate" />

				<div class="spacer" />

				<div class="item-actions">
					<VRemove deselect @action="deleteItem(element)" />
				</div>
			</VListItem>
		</VList>

		<div class="actions">
			<button v-if="totalItemCount < limit" @click="$emit('select')">
				{{ $t('add_existing') }}
			</button>
			<button v-if="totalItemCount > 0" @click="$emit('input', undefined)">
				{{ $t('clear_items') }}
			</button>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.one-to-many {
	block-size: 100%;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.v-list {
	@include mixins.list-interface;
}

.actions {
	@include mixins.list-interface-actions;

	button {
		color: var(--theme--primary);
		padding: 0 4px;

		&:hover {
			color: var(--theme--primary-accent);
		}
	}
}

.item-actions {
	@include mixins.list-interface-item-actions;
}
</style>

<template>
	<div v-if="collection.collection.startsWith('directus_') === false">
		<v-menu placement="left-start" show-arrow>
			<template #activator="{ toggle }">
				<v-icon name="more_vert" @click="toggle" class="ctx-toggle" />
			</template>
			<v-list>
				<v-list-item @click="deleteActive = true" class="danger">
					<v-list-item-icon>
						<v-icon name="delete" outline />
					</v-list-item-icon>
					<v-list-item-content>
						{{ $t('delete_collection') }}
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>
		<v-dialog v-model="deleteActive" @esc="deleteActive = null">
			<v-card>
				<v-card-title>{{ $t('delete_collection_are_you_sure') }}</v-card-title>
				<v-card-actions>
					<v-button :disabled="deleting" secondary @click="deleteActive = null">
						{{ $t('cancel') }}
					</v-button>
					<v-button :loading="deleting" class="delete" @click="deleteCollection">
						{{ $t('delete_collection') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from '@vue/composition-api';
import { Collection } from '@/types';
import { useCollectionsStore } from '@/stores/';

export default defineComponent({
	props: {
		collection: {
			type: Object as PropType<Collection>,
			required: true,
		},
	},
	setup(props) {
		const collectionsStore = useCollectionsStore();
		const { deleting, deleteActive, deleteCollection } = useDelete();

		return { deleting, deleteActive, deleteCollection };

		function useDelete() {
			const deleting = ref(false);
			const deleteActive = ref(false);

			return { deleting, deleteActive, deleteCollection };

			async function deleteCollection() {
				deleting.value = true;

				try {
					await collectionsStore.deleteCollection(props.collection.collection);
					deleteActive.value = false;
				} finally {
					deleting.value = false;
				}
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.v-button.delete {
	--v-button-background-color: var(--danger);
	--v-button-background-color-hover: var(--danger-125);
}

.ctx-toggle {
	--v-icon-color: var(--foreground-subdued);

	&:hover {
		--v-icon-color: var(--foreground-normal);
	}
}

.v-list-item.danger {
	--v-list-item-color: var(--danger);
	--v-list-item-color-hover: var(--danger);
	--v-list-item-icon-color: var(--danger);
}

.v-list-item.warning {
	--v-list-item-color: var(--warning);
	--v-list-item-color-hover: var(--warning);
	--v-list-item-icon-color: var(--warning);
}
</style>

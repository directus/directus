<template>
	<div v-if="collection.collection.startsWith('directus_') === false">
		<v-menu placement="left-start" show-arrow>
			<template #activator="{ toggle }">
				<v-icon name="more_vert" clickable class="ctx-toggle" @click.prevent="toggle" />
			</template>
			<v-list>
				<v-list-item v-if="collection.schema" clickable :to="`/content/${collection.collection}`">
					<v-list-item-icon>
						<v-icon name="box" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ t('goto_collection_content') }}
					</v-list-item-content>
				</v-list-item>

				<v-list-item clickable @click="update({ meta: { hidden: !collection.meta?.hidden } })">
					<template v-if="collection.meta?.hidden === false">
						<v-list-item-icon><v-icon name="visibility_off" /></v-list-item-icon>
						<v-list-item-content>
							{{ collection.schema ? t('make_collection_hidden') : t('make_folder_hidden') }}
						</v-list-item-content>
					</template>
					<template v-else>
						<v-list-item-icon><v-icon name="visibility" /></v-list-item-icon>
						<v-list-item-content>
							{{ collection.schema ? t('make_collection_visible') : t('make_folder_visible') }}
						</v-list-item-content>
					</template>
				</v-list-item>

				<v-list-item clickable class="danger" @click="deleteActive = true">
					<v-list-item-icon>
						<v-icon name="delete" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ collection.schema ? t('delete_collection') : t('delete_folder') }}
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>

		<v-dialog v-model="deleteActive" @esc="deleteActive = null">
			<v-card>
				<v-card-title>
					{{
						collection.schema
							? t('delete_collection_are_you_sure', { collection: collection.collection })
							: t('delete_folder_are_you_sure', { folder: collection.collection })
					}}
				</v-card-title>
				<v-card-actions>
					<v-button :disabled="deleting" secondary @click="deleteActive = null">
						{{ t('cancel') }}
					</v-button>
					<v-button :loading="deleting" kind="danger" @click="deleteCollection">
						{{ collection.schema ? t('delete_collection') : t('delete_folder') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, ref } from 'vue';
import { Collection } from '@/types/collections';
import { useCollectionsStore } from '@/stores/collections';

export default defineComponent({
	props: {
		collection: {
			type: Object as PropType<Collection>,
			required: true,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const collectionsStore = useCollectionsStore();
		const { deleting, deleteActive, deleteCollection } = useDelete();

		return { t, deleting, deleteActive, deleteCollection, update };

		async function update(updates: Partial<Collection>) {
			await collectionsStore.updateCollection(props.collection.collection, updates);
		}

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

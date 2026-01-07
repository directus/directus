<script setup lang="ts">
import { isSystemCollection } from '@directus/system-data';
import type { DeepPartial } from '@directus/types';
import { computed, ref } from 'vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VNotice from '@/components/v-notice.vue';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { Collection } from '@/types/collections';
import { getCollectionRoute } from '@/utils/get-route';

type Props = {
	collection: Collection;
	hasNestedCollections: boolean;
};

const props = withDefaults(defineProps<Props>(), {});

const collectionsStore = useCollectionsStore();
const fieldsStore = useFieldsStore();
const relationsStore = useRelationsStore();
const { deleting, deleteActive, deleteCollection } = useDelete();

const peerDependencies = computed(() => {
	return relationsStore.relations
		.filter((relation) => {
			// a2o relations are ignored on purpose, to be able to select other collections afterwards
			return (
				relation.meta?.one_collection === props.collection.collection &&
				relation.meta?.many_collection &&
				relation.meta?.many_field
			);
		})
		.map((relation) => ({
			collection: relation.meta?.many_collection,
			field: relation.meta?.many_field,
		}));
});

function useDelete() {
	const deleting = ref(false);
	const deleteActive = ref(false);

	return { deleting, deleteActive, deleteCollection };

	async function deleteCollection() {
		if (deleting.value) return;

		deleting.value = true;

		try {
			for (const dependency of peerDependencies.value) {
				await fieldsStore.deleteField(dependency.collection!, dependency.field!);
			}

			await collectionsStore.deleteCollection(props.collection.collection);
			deleteActive.value = false;
		} finally {
			deleting.value = false;
		}
	}
}

async function update(updates: DeepPartial<Collection>) {
	await collectionsStore.updateCollection(props.collection.collection, updates);
}
</script>

<template>
	<div v-if="isSystemCollection(collection.collection) === false">
		<VMenu placement="left-start" show-arrow>
			<template #activator="{ toggle }">
				<VIcon name="more_vert" clickable class="ctx-toggle" @click.prevent="toggle" />
			</template>
			<VList>
				<VListItem v-if="collection.schema" clickable :to="getCollectionRoute(collection.collection)">
					<VListItemIcon>
						<VIcon name="box" />
					</VListItemIcon>
					<VListItemContent>
						{{ $t('goto_collection_content') }}
					</VListItemContent>
				</VListItem>

				<VListItem clickable @click="update({ meta: { hidden: !collection.meta?.hidden } })">
					<template v-if="collection.meta?.hidden === false">
						<VListItemIcon><VIcon name="visibility_off" /></VListItemIcon>
						<VListItemContent>
							{{ collection.schema ? $t('make_collection_hidden') : $t('make_folder_hidden') }}
						</VListItemContent>
					</template>
					<template v-else>
						<VListItemIcon><VIcon name="visibility" /></VListItemIcon>
						<VListItemContent>
							{{ collection.schema ? $t('make_collection_visible') : $t('make_folder_visible') }}
						</VListItemContent>
					</template>
				</VListItem>

				<template v-if="collection.type === 'alias' || hasNestedCollections">
					<VDivider />

					<VListItem
						:active="collection.meta?.collapse === 'open'"
						clickable
						@click="update({ meta: { collapse: 'open' } })"
					>
						<VListItemIcon>
							<VIcon name="folder_open" />
						</VListItemIcon>
						<VListItemContent>
							{{ $t('start_open') }}
						</VListItemContent>
					</VListItem>

					<VListItem
						:active="collection.meta?.collapse === 'closed'"
						clickable
						@click="update({ meta: { collapse: 'closed' } })"
					>
						<VListItemIcon>
							<VIcon name="folder" />
						</VListItemIcon>
						<VListItemContent>
							{{ $t('start_collapsed') }}
						</VListItemContent>
					</VListItem>

					<VListItem
						:active="collection.meta?.collapse === 'locked'"
						clickable
						@click="update({ meta: { collapse: 'locked' } })"
					>
						<VListItemIcon>
							<VIcon name="folder_lock" />
						</VListItemIcon>
						<VListItemContent>
							{{ $t('always_open') }}
						</VListItemContent>
					</VListItem>

					<VDivider />
				</template>

				<VListItem clickable class="danger" @click="deleteActive = true">
					<VListItemIcon>
						<VIcon name="delete" />
					</VListItemIcon>
					<VListItemContent>
						{{ collection.schema ? $t('delete_collection') : $t('delete_folder') }}
					</VListItemContent>
				</VListItem>
			</VList>
		</VMenu>

		<VDialog v-model="deleteActive" @esc="deleteActive = false" @apply="deleteCollection">
			<VCard>
				<VCardTitle>
					{{
						collection.schema
							? $t('delete_collection_are_you_sure', { collection: collection.collection })
							: $t('delete_folder_are_you_sure', { folder: collection.collection })
					}}
				</VCardTitle>
				<VCardText v-if="peerDependencies.length > 0">
					<VNotice type="danger">
						<div class="delete-dependencies">
							{{ $t('delete_collection_peer_dependencies') }}
							<ul>
								<li v-for="dependency in peerDependencies" :key="dependency.collection">
									{{ dependency.field }} ({{ dependency.collection }})
								</li>
							</ul>
						</div>
					</VNotice>
				</VCardText>
				<VCardActions>
					<VButton :disabled="deleting" secondary @click="deleteActive = false">
						{{ $t('cancel') }}
					</VButton>
					<VButton :loading="deleting" kind="danger" @click="deleteCollection">
						{{ collection.schema ? $t('delete_collection') : $t('delete_folder') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</div>
</template>

<style lang="scss" scoped>
.ctx-toggle {
	--v-icon-color: var(--theme--foreground-subdued);

	&:hover {
		--v-icon-color: var(--theme--foreground);
	}
}

.v-list-item.danger {
	--v-list-item-color: var(--theme--danger);
	--v-list-item-color-hover: var(--theme--danger);
	--v-list-item-icon-color: var(--theme--danger);
}

.v-list-item.warning {
	--v-list-item-color: var(--theme--warning);
	--v-list-item-color-hover: var(--theme--warning);
	--v-list-item-icon-color: var(--theme--warning);
}

.delete-dependencies {
	display: flex;
	flex-direction: column;
}
</style>

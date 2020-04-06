<template>
	<collections-not-found v-if="error && error.code === 404" />
	<private-view v-else :title="$t('editing', { collection: collectionInfo.name })">
		<template #title-outer:prepend>
			<v-button rounded icon secondary exact :to="breadcrumb[1].to">
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #actions>
			<v-dialog v-model="confirmDelete">
				<template #activator="{ on }">
					<v-button
						rounded
						icon
						class="action-delete"
						:disabled="item === null"
						@click="on"
					>
						<v-icon name="delete" />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ $t('delete_are_you_sure') }}</v-card-title>

					<v-card-actions>
						<v-button @click="confirmDelete = false" secondary>
							{{ $t('cancel') }}
						</v-button>
						<v-button @click="deleteAndQuit" class="action-delete" :loading="deleting">
							{{ $t('delete') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button
				rounded
				icon
				:loading="saving"
				:disabled="hasEdits === false"
				@click="saveAndQuit"
			>
				<v-icon name="check" />
			</v-button>
		</template>

		<template #navigation>
			<collections-navigation />
		</template>

		<v-form
			:loading="loading"
			:initial-values="item"
			:collection="collection"
			v-model="edits"
		/>

		<template #drawer>
			<activity-drawer-detail :collection="collection" :primary-key="primaryKey" />
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref, toRefs, watch } from '@vue/composition-api';
import useProjectsStore from '@/stores/projects';
import api from '@/api';
import CollectionsNavigation from '../../components/navigation/';
import { i18n } from '@/lang';
import router from '@/router';
import CollectionsNotFound from '../not-found/';
import useCollection from '@/compositions/use-collection';
import ActivityDrawerDetail from '@/components/activity-drawer-detail';

type Values = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[field: string]: any;
};

export default defineComponent({
	name: 'collections-detail',
	components: { CollectionsNavigation, CollectionsNotFound, ActivityDrawerDetail },
	props: {
		collection: {
			type: String,
			required: true,
		},
		primaryKey: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const projectsStore = useProjectsStore();
		const { currentProjectKey } = toRefs(projectsStore.state);

		const { info: collectionInfo } = useCollection(props.collection);

		const isNew = computed<boolean>(() => props.primaryKey === '+');

		const edits = ref({});
		const hasEdits = computed<boolean>(() => Object.keys(edits.value).length > 0);

		const { item, error, loading, saving, fetchItem, saveAndQuit } = useItem();
		const { breadcrumb } = useBreadcrumb();
		const { deleting, confirmDelete, deleteAndQuit } = useDelete();

		watch(() => props.primaryKey, fetchItem);

		if (isNew.value === false) fetchItem();

		return {
			item,
			loading,
			error,
			isNew,
			breadcrumb,
			edits,
			hasEdits,
			saveAndQuit,
			saving,
			deleting,
			deleteAndQuit,
			confirmDelete,
			collectionInfo,
		};

		function useBreadcrumb() {
			const breadcrumb = computed(() => [
				{
					name: i18n.tc('collection', 2),
					to: `/${currentProjectKey.value}/collections/`,
				},
				{
					name: collectionInfo.value?.name,
					to: `/${currentProjectKey.value}/collections/${props.collection}/`,
				},
			]);

			return { breadcrumb };
		}

		function useItem() {
			const item = ref<Values>(null);
			const error = ref(null);
			const loading = ref(true);
			const saving = ref(false);

			return { item, error, loading, saving, fetchItem, saveAndQuit };

			async function fetchItem() {
				loading.value = true;
				try {
					const response = await api.get(
						`/${currentProjectKey.value}/items/${props.collection}/${props.primaryKey}`
					);
					item.value = response.data.data;
				} catch (error) {
					error.value = error;
				} finally {
					loading.value = false;
				}
			}

			async function saveAndQuit() {
				saving.value = true;

				try {
					if (isNew.value === true) {
						await api.post(
							`/${currentProjectKey.value}/items/${props.collection}`,
							edits.value
						);
					} else {
						await api.patch(
							`/${currentProjectKey.value}/items/${props.collection}/${props.primaryKey}`,
							edits.value
						);
					}
				} catch (error) {
					/** @TODO show real notification */
					alert(error);
				} finally {
					saving.value = true;
					router.push(`/${currentProjectKey.value}/collections/${props.collection}`);
				}
			}
		}

		function useDelete() {
			const deleting = ref(false);
			const confirmDelete = ref(false);

			return { deleting, confirmDelete, deleteAndQuit };

			async function deleteAndQuit() {
				if (isNew.value === true) return;

				deleting.value = true;

				try {
					await api.delete(
						`/${currentProjectKey}/items/${props.collection}/${props.primaryKey}`
					);
				} catch (error) {
					/** @TODO show real notification */
					alert(error);
				} finally {
					router.push(`/${currentProjectKey}/collections/${props.collection}`);
					deleting.value = false;
				}
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color: var(--danger);
	--v-button-background-color-hover: var(--danger-dark);
}

.v-form {
	padding: var(--content-padding);
}
</style>

<template>
	<collections-not-found v-if="error && error.code === 404" />
	<private-view v-else :title="$t('editing', { collection: collectionInfo.name })">
		<template #title-outer:prepend>
			<v-button v-if="collectionInfo.single" rounded icon secondary disabled>
				<v-icon :name="collectionInfo.icon" />
			</v-button>
			<v-button v-else rounded icon secondary exact :to="breadcrumb[1].to">
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
						v-if="collectionInfo.single === false"
					>
						<v-icon name="delete_forever" />
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

			<v-dialog v-if="softDeleteStatus" v-model="confirmSoftDelete">
				<template #activator="{ on }">
					<v-button
						rounded
						icon
						class="action-delete"
						:disabled="item === null"
						@click="on"
						v-if="collectionInfo.single === false"
					>
						<v-icon name="delete" />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ $t('delete_are_you_sure') }}</v-card-title>

					<v-card-actions>
						<v-button @click="confirmSoftDelete = false" secondary>
							{{ $t('cancel') }}
						</v-button>
						<v-button
							@click="deleteAndQuit(true)"
							class="action-delete"
							:loading="softDeleting"
						>
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

				<template #append-outer>
					<save-options
						v-if="collectionInfo.single === false"
						:disabled="hasEdits === false"
						@save-and-stay="saveAndStay"
						@save-and-add-new="saveAndAddNew"
						@save-as-copy="saveAsCopyAndNavigate"
					/>
				</template>
			</v-button>
		</template>

		<template #navigation>
			<collections-navigation />
		</template>

		<v-form
			:loading="loading"
			:initial-values="item"
			:collection="collection"
			:batch-mode="isBatch"
			v-model="edits"
		/>

		<template #drawer>
			<activity-drawer-detail
				v-if="isNew === false"
				:collection="collection"
				:primary-key="primaryKey"
			/>
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs, ref } from '@vue/composition-api';
import useProjectsStore from '@/stores/projects';
import CollectionsNavigation from '../../components/navigation/';
import { i18n } from '@/lang';
import router from '@/router';
import CollectionsNotFound from '../not-found/';
import useCollection from '@/compositions/use-collection';
import ActivityDrawerDetail from '@/views/private/components/activity-drawer-detail';
import useItem from '@/compositions/use-item';
import SaveOptions from '@/views/private/components/save-options';

type Values = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[field: string]: any;
};

export default defineComponent({
	name: 'collections-detail',
	components: { CollectionsNavigation, CollectionsNotFound, ActivityDrawerDetail, SaveOptions },
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
		const { collection, primaryKey } = toRefs(props);

		const { info: collectionInfo, softDeleteStatus } = useCollection(collection);
		const { breadcrumb } = useBreadcrumb();

		const {
			isNew,
			edits,
			item,
			saving,
			loading,
			error,
			save,
			remove,
			deleting,
			softDeleting,
			saveAsCopy,
			isBatch,
		} = useItem(collection, primaryKey);

		const hasEdits = computed<boolean>(() => Object.keys(edits.value).length > 0);

		const confirmDelete = ref(false);
		const confirmSoftDelete = ref(false);

		return {
			item,
			loading,
			error,
			isNew,
			breadcrumb,
			edits,
			hasEdits,
			saving,
			collectionInfo,
			saveAndQuit,
			deleteAndQuit,
			confirmDelete,
			confirmSoftDelete,
			deleting,
			softDeleting,
			saveAndStay,
			saveAndAddNew,
			saveAsCopyAndNavigate,
			isBatch,
			softDeleteStatus,
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

		async function saveAndQuit() {
			await save();
			router.push(`/${currentProjectKey.value}/collections/${props.collection}`);
		}

		async function saveAndStay() {
			await save();
		}

		async function saveAndAddNew() {
			await save();
			router.push(`/${currentProjectKey.value}/collections/${props.collection}/+`);
		}

		async function saveAsCopyAndNavigate() {
			const newPrimaryKey = await saveAsCopy();
			router.push(
				`/${currentProjectKey.value}/collections/${props.collection}/${newPrimaryKey}`
			);
		}

		async function deleteAndQuit(soft = false) {
			await remove(soft);
			router.push(`/${currentProjectKey.value}/collections/${props.collection}`);
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

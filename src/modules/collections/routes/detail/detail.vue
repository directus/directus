<template>
	<collections-not-found v-if="error && error.code === 404" />
	<private-view
		v-else
		:title="
			isNew
				? $t('adding_in', { collection: collectionInfo.name })
				: $t('editing_in', { collection: collectionInfo.name })
		"
	>
		<template #title v-if="isNew === false && collectionInfo.display_template">
			<v-skeleton-loader class="title-loader" type="text" v-if="loading" />
			<h1 class="type-title" v-else>
				<render-template
					:collection="collectionInfo.collection"
					:item="templateValues"
					:template="collectionInfo.display_template"
				/>
			</h1>
		</template>

		<template #title-outer:prepend>
			<v-button
				v-if="collectionInfo.single"
				class="header-icon"
				rounded
				icon
				secondary
				disabled
			>
				<v-icon :name="collectionInfo.icon" />
			</v-button>
			<v-button
				v-else
				class="header-icon"
				rounded
				icon
				secondary
				exact
				v-tooltip.bottom="$t('back')"
				:to="backLink"
			>
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #actions>
			<v-dialog v-if="!isNew" v-model="confirmDelete">
				<template #activator="{ on }">
					<v-button
						rounded
						icon
						class="action-delete"
						v-tooltip.bottom="$t('delete_forever')"
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

			<v-dialog v-if="softDeleteStatus && !isNew" v-model="confirmSoftDelete">
				<template #activator="{ on }">
					<v-button
						rounded
						icon
						class="action-delete"
						v-tooltip.bottom="$t('delete')"
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
				v-tooltip.bottom="$t('save')"
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
			:primary-key="primaryKey"
			v-model="edits"
		/>

		<template #drawer>
			<activity-drawer-detail
				v-if="isBatch === false && isNew === false"
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
import router from '@/router';
import CollectionsNotFound from '../not-found/';
import useCollection from '@/composables/use-collection';
import ActivityDrawerDetail from '@/views/private/components/activity-drawer-detail';
import useItem from '@/composables/use-item';
import SaveOptions from '@/views/private/components/save-options';

type Values = {
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

		const { info: collectionInfo, softDeleteStatus, primaryKeyField } = useCollection(
			collection
		);

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

		const backLink = computed(
			() => `/${currentProjectKey.value}/collections/${collection.value}/`
		);

		const templateValues = computed(() => {
			return {
				...(item.value || {}),
				...edits.value,
			};
		});

		return {
			item,
			loading,
			backLink,
			error,
			isNew,
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
			templateValues,
		};

		async function saveAndQuit() {
			await save();
			router.push(`/${currentProjectKey.value}/collections/${props.collection}`);
		}

		async function saveAndStay() {
			const savedItem: Record<string, any> = await save();

			if (props.primaryKey === '+') {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const newPrimaryKey = savedItem[primaryKeyField.value!.field];
				router.replace(
					`/${currentProjectKey.value}/collections/${props.collection}/${newPrimaryKey}`
				);
			}
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
	--v-button-background-color: var(--danger-25);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-50);
	--v-button-color-hover: var(--danger);
}

.header-icon.secondary {
	--v-button-background-color: var(--background-normal);
	--v-button-color-disabled: var(--foreground-normal);
	--v-button-color-activated: var(--foreground-normal);
}

.v-form {
	padding: var(--content-padding);
}

.title-loader {
	width: 260px;
}
</style>

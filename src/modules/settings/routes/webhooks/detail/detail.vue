<template>
	<private-view :title="$t('editing', { collection: $t('webhooks') })">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact :to="breadcrumb[0].to">
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

				<template #append-outer>
					<save-options
						:disabled="hasEdits === false"
						@save-and-stay="saveAndStay"
						@save-and-add-new="saveAndAddNew"
						@save-as-copy="saveAsCopyAndNavigate"
					/>
				</template>
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<v-form
			:loading="loading"
			:initial-values="item"
			collection="directus_webhooks"
			:batch-mode="isBatch"
			:primary-key="primaryKey"
			v-model="edits"
		/>

		<template #drawer>
			<activity-drawer-detail
				v-if="isNew === false"
				collection="directus_webhooks"
				:primary-key="primaryKey"
			/>
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs, ref } from '@vue/composition-api';
import useProjectsStore from '@/stores/projects';
import SettingsNavigation from '../../../components/navigation/';
import { i18n } from '@/lang';
import router from '@/router';
import ActivityDrawerDetail from '@/views/private/components/activity-drawer-detail';
import useItem from '@/composables/use-item';
import SaveOptions from '@/views/private/components/save-options';

type Values = {
	[field: string]: any;
};

export default defineComponent({
	name: 'webhooks-detail',
	components: { SettingsNavigation, ActivityDrawerDetail, SaveOptions },
	props: {
		primaryKey: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const projectsStore = useProjectsStore();
		const { currentProjectKey } = toRefs(projectsStore.state);
		const { primaryKey } = toRefs(props);
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
			saveAsCopy,
			isBatch,
		} = useItem(ref('directus_webhooks'), primaryKey);

		const hasEdits = computed<boolean>(() => Object.keys(edits.value).length > 0);

		const confirmDelete = ref(false);

		return {
			item,
			loading,
			error,
			isNew,
			breadcrumb,
			edits,
			hasEdits,
			saving,
			saveAndQuit,
			deleteAndQuit,
			confirmDelete,
			deleting,
			saveAndStay,
			saveAndAddNew,
			saveAsCopyAndNavigate,
			isBatch,
		};

		function useBreadcrumb() {
			const breadcrumb = computed(() => [
				{
					name: i18n.t('webhooks'),
					to: `/${currentProjectKey.value}/settings/webhooks/`,
				},
			]);

			return { breadcrumb };
		}

		async function saveAndQuit() {
			await save();
			router.push(`/${currentProjectKey.value}/settings/webhooks`);
		}

		async function saveAndStay() {
			await save();
		}

		async function saveAndAddNew() {
			await save();
			router.push(`/${currentProjectKey.value}/settings/webhooks/+`);
		}

		async function saveAsCopyAndNavigate() {
			const newPrimaryKey = await saveAsCopy();
			router.push(`/${currentProjectKey.value}/settings/webhooks/${newPrimaryKey}`);
		}

		async function deleteAndQuit() {
			await remove();
			router.push(`/${currentProjectKey.value}/settings/webhooks`);
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

.v-form {
	padding: var(--content-padding);
}

.header-icon {
	--v-button-background-color: var(--warning-25);
	--v-button-color: var(--warning);
	--v-button-background-color-hover: var(--warning-50);
	--v-button-color-hover: var(--warning);
}
</style>

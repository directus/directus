<script setup lang="ts">
import {
	deleteDeployment,
	type DeploymentProjectListOutput,
	readDeployment,
	readDeploymentProjects,
	updateDeployment,
	updateDeploymentProjects,
} from '@directus/sdk';
import type { DeploymentConfig } from '@directus/types';
import { isEmpty, isEqual, isNil, pickBy } from 'lodash';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import DeploymentNavigation from '../../components/navigation.vue';
import { useDeploymentNavigation } from '../../composables/use-deployment-navigation';
import { useProviderConfigs } from '../../config/provider-fields';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VCheckbox from '@/components/v-checkbox.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { useEditsGuard } from '@/composables/use-edits-guard';
import InterfacePresentationDivider from '@/interfaces/presentation-divider/presentation-divider.vue';
import { sdk } from '@/sdk';
import { unexpectedError } from '@/utils/unexpected-error';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';

const props = defineProps<{
	provider: string;
}>();

const router = useRouter();
const { refresh: refreshNavigation } = useDeploymentNavigation();
const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const confirmDelete = ref(false);
const confirmRemoveProjects = ref(false);
const projectsToRemove = ref<string[]>([]);
const config = ref<DeploymentConfig | null>(null);
const credentialsEdits = ref<Record<string, any>>({});
const optionsEdits = ref<Record<string, any>>({});
const availableProjects = ref<DeploymentProjectListOutput[]>([]);
const selectedProjectIds = ref<string[]>([]);
const initialProjectIds = ref<string[]>([]);

// Filter out empty values (null, undefined, "")
const filterEmpty = (obj: Record<string, any>) => pickBy(obj, (v) => !isNil(v) && v !== '');

// hasEdits computed - compare actual values using lodash
const hasEdits = computed(() => {
	// Credentials: check if there are any non-empty values
	const hasCredentialsEdits = !isEmpty(filterEmpty(credentialsEdits.value));

	// Options: compare normalized current values with initial
	const initialOptions = filterEmpty(config.value?.options || {});
	const currentOptions = filterEmpty({ ...config.value?.options, ...optionsEdits.value });
	const hasOptionsEdits = !isEqual(initialOptions, currentOptions);

	// Projects: compare sorted arrays
	const projectsChanged = !isEqual([...selectedProjectIds.value].sort(), [...initialProjectIds.value].sort());

	return hasCredentialsEdits || hasOptionsEdits || projectsChanged;
});

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

function discardAndLeave() {
	if (!leaveTo.value) return;
	credentialsEdits.value = {};
	optionsEdits.value = {};
	selectedProjectIds.value = [...initialProjectIds.value];
	confirmLeave.value = false;
	router.push(leaveTo.value);
}

const hasExistingCredentials = computed(() => !!config.value?.credentials);

const credentialsFields = computed(() => {
	const { providerConfigs } = useProviderConfigs(hasExistingCredentials.value, true);
	return providerConfigs[props.provider]?.credentialsFields || [];
});

const optionsFields = computed(() => {
	const { providerConfigs } = useProviderConfigs(hasExistingCredentials.value, true);
	return providerConfigs[props.provider]?.optionsFields || [];
});

async function loadConfig() {
	loading.value = true;

	try {
		// Load deployment config (without projects - we get them from readDeploymentProjects)
		const configData = await sdk.request(
			readDeployment(props.provider, {
				fields: ['id', 'provider', 'options', 'credentials'],
			}),
		);

		config.value = configData as DeploymentConfig;

		// Load all projects from provider
		const projectsData = await sdk.request(readDeploymentProjects(props.provider));
		availableProjects.value = projectsData as DeploymentProjectListOutput[];

		// Set selected projects from the response (id !== null means selected)
		const storedIds = projectsData.filter((p: any) => p.id !== null).map((p: any) => p.external_id);
		selectedProjectIds.value = [...storedIds];
		initialProjectIds.value = [...storedIds];
	} catch (error) {
		unexpectedError(error);
	} finally {
		loading.value = false;
	}
}

function checkSave() {
	// Check if we have projects to remove
	const toDelete = initialProjectIds.value.filter((id) => !selectedProjectIds.value.includes(id));

	if (toDelete.length > 0) {
		projectsToRemove.value = toDelete.map((id) => {
			const project = availableProjects.value.find((p) => p.external_id === id);
			return project?.name || id;
		});

		confirmRemoveProjects.value = true;
	} else {
		save();
	}
}

async function save() {
	if (!config.value) return;

	saving.value = true;
	confirmRemoveProjects.value = false;

	try {
		const updatePayload: Record<string, any> = {};

		if (Object.keys(credentialsEdits.value).length > 0) {
			updatePayload.credentials = credentialsEdits.value;
		}

		if (Object.keys(optionsEdits.value).length > 0) {
			updatePayload.options = { ...config.value?.options, ...optionsEdits.value };
		}

		// Update deployment config if we have anything to save
		if (Object.keys(updatePayload).length > 0) {
			await sdk.request(updateDeployment(props.provider, updatePayload));
		}

		// Compute project changes
		const toCreate = selectedProjectIds.value.filter((id) => !initialProjectIds.value.includes(id));
		const toDelete = initialProjectIds.value.filter((id) => !selectedProjectIds.value.includes(id));

		// Update projects if changed
		if (toCreate.length > 0 || toDelete.length > 0) {
			const projectsToDelete = availableProjects.value
				.filter(
					(p): p is DeploymentProjectListOutput & { id: string } => toDelete.includes(p.external_id) && p.id !== null,
				)
				.map((p) => p.id);

			const projectsToCreate = toCreate.map((externalId) => {
				const project = availableProjects.value.find((p) => p.external_id === externalId);
				return { external_id: externalId, name: project!.name };
			});

			await sdk.request(
				updateDeploymentProjects(props.provider, {
					create: projectsToCreate,
					delete: projectsToDelete,
				}),
			);
		}

		// Refresh navigation to reflect project changes
		await refreshNavigation();

		credentialsEdits.value = {};
		optionsEdits.value = {};
		initialProjectIds.value = [...selectedProjectIds.value];
		projectsToRemove.value = [];

		// Navigate to dashboard if we have projects
		if (selectedProjectIds.value.length > 0) {
			router.push(`/deployment/${props.provider}`);
		}
	} catch (error) {
		unexpectedError(error);
	} finally {
		saving.value = false;
	}
}

async function deleteConfig() {
	deleting.value = true;

	try {
		await sdk.request(deleteDeployment(props.provider));
		await refreshNavigation();
		confirmDelete.value = false;
		router.push('/deployment');
	} catch (error) {
		unexpectedError(error);
	} finally {
		deleting.value = false;
	}
}

onMounted(() => {
	loadConfig();
});
</script>

<template>
	<PrivateView :title="$t('deployment.provider.settings.settings', { provider: $t(`deployment.provider.${provider}.name`) })">
		<template #headline>
			<VBreadcrumb :items="[{ name: $t('deployment.deployment'), to: '/deployment' }]" />
		</template>

		<template v-if="initialProjectIds.length > 0" #title-outer:prepend>
			<VButton class="back-button" rounded icon secondary exact small @click="router.push(`/deployment/${provider}`)">
				<VIcon name="arrow_back" small />
			</VButton>
		</template>

		<template #navigation>
			<DeploymentNavigation />
		</template>

		<template #actions>
			<VButton
				v-tooltip.bottom="$t('deployment.provider.settings.delete')"
				rounded
				icon
				small
				kind="danger"
				@click="confirmDelete = true"
			>
				<VIcon name="delete" small />
			</VButton>

			<PrivateViewHeaderBarActionButton
				v-tooltip.bottom="$t('save')"
				:disabled="!hasEdits"
				:loading="saving"
				icon="check"
				@click="checkSave"
			/>
		</template>

		<div class="container">
			<VProgressCircular v-if="loading" class="spinner" indeterminate />

			<template v-else>
				<InterfacePresentationDivider
					:title="
						$t('deployment.provider.settings.edit_credentials', { provider: $t(`deployment.provider.${provider}.name`) })
					"
					icon="key"
				/>

				<div :class="{ 'credentials-saved': hasExistingCredentials }">
					<VForm v-model="credentialsEdits" :fields="credentialsFields as any" :initial-values="{}" primary-key="+" />
				</div>

				<InterfacePresentationDivider
					v-if="optionsFields.length > 0"
					:title="$t('deployment.provider.settings.edit_options', { provider: $t(`deployment.provider.${provider}.name`) })"
					icon="settings"
				/>

				<VForm
					v-if="optionsFields.length > 0"
					v-model="optionsEdits"
					:fields="optionsFields as any"
					:initial-values="config?.options || {}"
					primary-key="+"
				/>

				<InterfacePresentationDivider :title="$t('deployment.provider.projects')" icon="assignment" />

				<div class="type-label">{{ $t('deployment.provider.select_projects') }}</div>
				<div class="checkboxes">
					<VCheckbox
						v-for="project in availableProjects"
						:key="project.external_id"
						block
						:value="project.external_id"
						:label="project.name"
						:disabled="!project.deployable"
						:model-value="selectedProjectIds"
						@update:model-value="(value) => (selectedProjectIds = value)"
					>
						<template v-if="!project.deployable" #append>
							<VIcon v-tooltip.left="$t('deployment.provider.project.not_deployable')" name="info" small />
						</template>
					</VCheckbox>
				</div>
				<small class="type-note">{{ $t('deployment.provider.select_projects_hint') }}</small>
			</template>
		</div>

		<VDialog v-model="confirmLeave" @esc="confirmLeave = false" @apply="discardAndLeave">
			<VCard>
				<VCardTitle>{{ $t('unsaved_changes') }}</VCardTitle>
				<VCardText>{{ $t('unsaved_changes_copy') }}</VCardText>
				<VCardActions>
					<VButton secondary @click="discardAndLeave">
						{{ $t('discard_changes') }}
					</VButton>
					<VButton @click="confirmLeave = false">{{ $t('keep_editing') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

		<VDialog v-model="confirmDelete" @esc="confirmDelete = false">
			<VCard>
				<VCardTitle>{{ $t('deployment.provider.settings.delete_confirm') }}</VCardTitle>
				<VCardActions>
					<VButton secondary @click="confirmDelete = false">{{ $t('cancel') }}</VButton>
					<VButton kind="danger" :loading="deleting" @click="deleteConfig">
						{{ $t('delete_label') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

		<VDialog v-model="confirmRemoveProjects" @esc="confirmRemoveProjects = false">
			<VCard>
				<VCardTitle>
					{{ $t('deployment.provider.settings.remove_projects_confirm', { projects: projectsToRemove.join(', ') }) }}
				</VCardTitle>
				<VCardActions>
					<VButton secondary @click="confirmRemoveProjects = false">{{ $t('cancel') }}</VButton>
					<VButton kind="danger" :loading="saving" @click="save">
						{{ $t('delete_label') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</PrivateView>
</template>

<style scoped lang="scss">
.back-button {
	--v-button-background-color: var(--theme--background-normal);
	--v-button-color-active: var(--theme--foreground);
}

.container {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}

.spinner {
	margin: 120px auto;
}

:deep(.presentation-divider) {
	margin-block-start: 0;
	margin-block-end: var(--theme--form--row-gap);

	&:not(:first-child) {
		margin-block-start: var(--theme--form--row-gap);
	}
}

.credentials-saved :deep(.v-input) {
	--v-input-placeholder-color: var(--theme--primary);
}

.type-label {
	margin-block-end: 8px;
}

.type-note {
	display: block;
	margin-block-start: 10px;
}

.checkboxes {
	display: grid;
	gap: 12px;
}
</style>

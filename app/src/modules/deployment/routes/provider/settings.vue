<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { isNil, isEmpty, isEqual, pickBy } from 'lodash';
import { sdk } from '@/sdk';
import { readDeployment, readDeploymentProjects, updateDeployment, updateDeploymentProjects } from '@directus/sdk';
import { unexpectedError } from '@/utils/unexpected-error';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { PrivateView } from '@/views/private';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCard from '@/components/v-card.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCheckbox from '@/components/v-checkbox.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import InterfacePresentationDivider from '@/interfaces/presentation-divider/presentation-divider.vue';
import type { DeploymentConfig, Project } from '@directus/types';
import { useProviderConfigs } from '../../config/provider-fields';
import { useDeploymentNavigation } from '../../composables/use-deployment-navigation';
import DeploymentNavigation from '../../components/navigation.vue';

const props = defineProps<{
	provider: string;
}>();

const router = useRouter();
const { refresh: refreshNavigation } = useDeploymentNavigation();
const loading = ref(true);
const saving = ref(false);
const config = ref<DeploymentConfig | null>(null);
const credentialsEdits = ref<Record<string, any>>({});
const optionsEdits = ref<Record<string, any>>({});
const availableProjects = ref<Project[]>([]);
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
	const projectsChanged = !isEqual(
		[...selectedProjectIds.value].sort(),
		[...initialProjectIds.value].sort(),
	);

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
		const configData = await sdk.request(readDeployment(props.provider, {
			fields: ['id', 'provider', 'options', 'credentials'],
		}));

		config.value = configData as DeploymentConfig;

		// Load all projects from provider
		const projectsData = await sdk.request(readDeploymentProjects(props.provider));
		availableProjects.value = projectsData as Project[];

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

async function save() {
	if (!config.value) return;

	saving.value = true;

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
			const projectsToDelete = config.value.projects
				?.filter((p: any) => toDelete.includes(p.external_id))
				.map((p: any) => p.id) || [];

			const projectsToCreate = toCreate.map((externalId) => {
				const project = availableProjects.value.find((p) => p.external_id === externalId);
				return { external_id: externalId, name: project?.name || '' };
			});

			await sdk.request(updateDeploymentProjects(props.provider, {
				create: projectsToCreate,
				delete: projectsToDelete,
			}));
		}

		// Refresh navigation to reflect project changes
		await refreshNavigation();

		credentialsEdits.value = {};
		optionsEdits.value = {};
		initialProjectIds.value = [...selectedProjectIds.value];

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

onMounted(() => {
	loadConfig();
});
</script>

<template>
	<PrivateView :title="$t('deployment_provider_settings', { provider: $t(`deployment_provider_${provider}`) })">
		<template #headline>
			<VBreadcrumb :items="[{ name: $t('deployment'), to: '/deployment' }]" />
		</template>

		<template #title-outer:prepend>
			<VButton class="back-button" rounded icon secondary exact small @click="router.push(`/deployment/${provider}`)">
				<VIcon name="arrow_back" small />
			</VButton>
		</template>

		<template #navigation>
			<DeploymentNavigation />
		</template>

		<template #actions>
			<PrivateViewHeaderBarActionButton
				v-tooltip.bottom="$t('save')"
				:disabled="!hasEdits"
				:loading="saving"
				icon="check"
				@click="save"
			/>
		</template>

		<div class="container">
			<VProgressCircular v-if="loading" class="spinner" indeterminate />

			<template v-else>
				<InterfacePresentationDivider :title="$t('deployment_provider_settings_edit_credentials', { provider: $t(`deployment_provider_${provider}`) })" icon="key" />

				<div :class="{ 'credentials-saved': hasExistingCredentials }">
					<VForm
						v-model="credentialsEdits"
						:fields="(credentialsFields as any)"
						:initial-values="{}"
						primary-key="+"
					/>
				</div>

				<InterfacePresentationDivider
					v-if="optionsFields.length > 0"
					:title="$t('deployment_provider_settings_edit_options', { provider: $t(`deployment_provider_${provider}`) })"
					icon="settings"
				/>

				<VForm
					v-if="optionsFields.length > 0"
					v-model="optionsEdits"
					:fields="(optionsFields as any)"
					:initial-values="config?.options || {}"
					primary-key="+"
				/>

				<InterfacePresentationDivider :title="$t('deployment_provider_projects')" icon="assignment" />

				<div class="type-label">{{ $t('deployment_provider_select_projects') }}</div>
				<div class="checkboxes">
					<VCheckbox
						v-for="project in availableProjects"
						:key="project.external_id"
						block
						:value="project.external_id"
						:label="project.name"
						:disabled="!project.deployable"
						:model-value="selectedProjectIds"
						@update:model-value="(value) => selectedProjectIds = value"
					>
						<template v-if="!project.deployable" #append>
							<VIcon
								v-tooltip.left="$t('deployment_provider_project_not_deployable')"
								name="info"
								small
							/>
						</template>
					</VCheckbox>
				</div>
				<small class="type-note">{{ $t('deployment_provider_select_projects_hint') }}</small>
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

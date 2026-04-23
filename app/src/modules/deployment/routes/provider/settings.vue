<script setup lang="ts">
import { useShortcut } from '@directus/composables';
import {
	deleteDeployment,
	type DeploymentProjectListOutput,
	readDeployment,
	readDeploymentProjects,
	updateDeployment,
	updateDeploymentProjects,
} from '@directus/sdk';
import type { DeploymentConfig, DeploymentProviderCapabilities } from '@directus/types';
import { isEmpty, isEqual, isNil, pickBy } from 'lodash';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import DeploymentNavigation from '../../components/navigation.vue';
import { useDeploymentNavigation } from '../../composables/use-deployment-navigation';
import { resolveDeploymentCapabilities, useProviderConfigs } from '../../config/providers';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VCheckbox from '@/components/v-checkbox.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { useEditsGuard } from '@/composables/use-edits-guard';
import InterfacePresentationDivider from '@/interfaces/presentation-divider/presentation-divider.vue';
import { sdk } from '@/sdk';
import { usePermissionsStore } from '@/stores/permissions';
import { unexpectedError } from '@/utils/unexpected-error';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';

const props = defineProps<{
	provider: string;
}>();

const router = useRouter();
const { refresh: refreshNavigation } = useDeploymentNavigation();
const permissionsStore = usePermissionsStore();

const canManageProjects =
	permissionsStore.hasPermission('directus_deployment_projects', 'create') ||
	permissionsStore.hasPermission('directus_deployment_projects', 'delete');

const canDelete = permissionsStore.hasPermission('directus_deployments', 'delete');
const canUpdate = permissionsStore.hasPermission('directus_deployments', 'update');
const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const confirmDelete = ref(false);
const confirmRemoveProjects = ref(false);
const projectsToRemove = ref<string[]>([]);
const config = ref<DeploymentConfig | null>(null);
const configurationEdits = ref<Record<string, any>>({});
const availableProjects = ref<DeploymentProjectListOutput[]>([]);
const selectedProjectIds = ref<string[]>([]);
const initialProjectIds = ref<string[]>([]);

const { providerConfigs } = useProviderConfigs(true, true);
const providerConfig = computed(() => providerConfigs.value[props.provider]);

// Capabilities drive conditional UI (e.g. deploy hooks section); populated after config loads
const capabilitiesFromApi = ref<DeploymentProviderCapabilities | null>(null);
const mergedCapabilities = computed(() => resolveDeploymentCapabilities(props.provider, capabilitiesFromApi.value));
const showDeployHookSetupNotice = computed(() => mergedCapabilities.value.supportsDeployHookUrl);

// Deploy hooks are stored per-project under options[deployHooksOptionKey]
const deployHooksOptionKey = 'deploy_hooks_by_project';
type DeployHookEntry = { name: string; url: string };
const projectDeployHooks = reactive<Record<string, DeployHookEntry[]>>({});
const initialProjectDeployHooks = ref<Record<string, DeployHookEntry[]>>({});
const expandedHookProjects = ref<Set<string>>(new Set());

function toggleHookExpansion(externalId: string) {
	if (expandedHookProjects.value.has(externalId)) {
		expandedHookProjects.value.delete(externalId);
	} else {
		expandedHookProjects.value.add(externalId);
	}
}

function addDeployHook(externalId: string) {
	if (!projectDeployHooks[externalId]) {
		projectDeployHooks[externalId] = [];
	}

	projectDeployHooks[externalId]!.push({ name: '', url: '' });
}

function removeDeployHook(externalId: string, index: number) {
	projectDeployHooks[externalId]?.splice(index, 1);
}

const allFields = computed(() => [
	...(providerConfig.value?.credentialsFields || []),
	...(providerConfig.value?.optionsFields || []),
]);

const credentialsFieldNames = computed(
	() => (providerConfig.value?.credentialsFields || []).map((f) => f.field).filter(Boolean) as string[],
);

const optionsFieldNames = computed(
	() => (providerConfig.value?.optionsFields || []).map((f) => f.field).filter(Boolean) as string[],
);

const filterEmpty = (obj: Record<string, any>) => pickBy(obj, (v) => !isNil(v) && v !== '');

// Returns i18n keys — Cloudflare has provider-specific copy pointing users to Workers Builds setup
function getProjectDeployableHint(provider: string): string {
	if (provider === 'cloudflare-workers') {
		return 'deployment.provider.project.not_deployable_cloudflare';
	}

	return 'deployment.provider.project.not_deployable';
}

function getProjectDeployableStatus(provider: string): string | null {
	if (provider === 'cloudflare-workers') {
		return 'deployment.provider.project.missing_build_trigger';
	}

	return null;
}

const hasDeployHookEdits = computed(() => {
	for (const externalId of Object.keys(projectDeployHooks)) {
		const current = projectDeployHooks[externalId] ?? [];
		const initial = initialProjectDeployHooks.value[externalId] ?? [];

		if (!isEqual(current, initial)) return true;
	}

	return false;
});

const hasEdits = computed(() => {
	const credentialsEdits = pickBy(configurationEdits.value, (_, key) => credentialsFieldNames.value.includes(key));
	const optionsEdits = pickBy(configurationEdits.value, (_, key) => optionsFieldNames.value.includes(key));

	const hasCredentialsEdits = !isEmpty(filterEmpty(credentialsEdits));

	const initialOptions = filterEmpty(config.value?.options || {});
	const currentOptions = filterEmpty({ ...initialOptions, ...optionsEdits });
	const hasOptionsEdits = !isEqual(initialOptions, currentOptions);

	const projectsChanged = !isEqual([...selectedProjectIds.value].sort(), [...initialProjectIds.value].sort());

	return hasCredentialsEdits || hasOptionsEdits || projectsChanged || hasDeployHookEdits.value;
});

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

useShortcut('meta+s', () => {
	if (hasEdits.value) checkSave();
});

function discardAndLeave() {
	if (!leaveTo.value) return;
	configurationEdits.value = {};
	selectedProjectIds.value = [...initialProjectIds.value];

	for (const key of Object.keys(projectDeployHooks)) {
		delete projectDeployHooks[key];
	}

	for (const [key, hooks] of Object.entries(initialProjectDeployHooks.value)) {
		projectDeployHooks[key] = hooks.map((h) => ({ ...h }));
	}

	confirmLeave.value = false;
	router.push(leaveTo.value);
}

async function loadConfig() {
	loading.value = true;

	try {
		// Load deployment config (without projects - we get them from readDeploymentProjects)
		const configData = await sdk.request(
			readDeployment(props.provider, {
				fields: ['id', 'provider', 'options', 'credentials'],
			}),
		);

		capabilitiesFromApi.value = (configData as DeploymentConfig).capabilities ?? null;

		config.value = configData as DeploymentConfig;

		// Hydrate deploy hooks from saved options, then snapshot as baseline for change detection
		const hooksByProject =
			(config.value.options?.[deployHooksOptionKey] as Record<string, DeployHookEntry[]> | undefined) ?? {};

		for (const key of Object.keys(projectDeployHooks)) {
			delete projectDeployHooks[key];
		}

		for (const [externalId, hooks] of Object.entries(hooksByProject)) {
			if (Array.isArray(hooks)) {
				projectDeployHooks[externalId] = hooks.map((hook) => ({
					name: hook?.name ?? '',
					url: hook?.url ?? '',
				}));
			}
		}

		initialProjectDeployHooks.value = Object.fromEntries(
			Object.entries(projectDeployHooks).map(([externalId, hooks]) => [externalId, hooks.map((hook) => ({ ...hook }))]),
		);

		if (canManageProjects) {
			// Load all projects from provider
			const projectsData = await sdk.request(readDeploymentProjects(props.provider));
			availableProjects.value = projectsData as DeploymentProjectListOutput[];

			// Set selected projects from the response (id !== null means selected)
			const storedIds = projectsData.filter((p: any) => p.id !== null).map((p: any) => p.external_id);
			selectedProjectIds.value = [...storedIds];
			initialProjectIds.value = [...storedIds];
		}
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

		// Extract credentials from edits
		for (const field of providerConfig.value?.credentialsFields || []) {
			if (
				field.field &&
				configurationEdits.value[field.field] !== undefined &&
				configurationEdits.value[field.field] !== ''
			) {
				updatePayload.credentials ??= {};
				updatePayload.credentials[field.field] = configurationEdits.value[field.field];
			}
		}

		// Extract options from edits
		for (const field of providerConfig.value?.optionsFields || []) {
			if (field.field && configurationEdits.value[field.field] !== undefined) {
				updatePayload.options ??= { ...config.value?.options };
				updatePayload.options[field.field] = configurationEdits.value[field.field];
			}
		}

		// Persist deploy hooks — skip incomplete entries (blank name or URL)
		if (mergedCapabilities.value.supportsDeployHookUrl && hasDeployHookEdits.value) {
			updatePayload.options ??= { ...config.value?.options };

			const hooksByProject = Object.fromEntries(
				Object.entries(projectDeployHooks).map(([externalId, hooks]) => [
					externalId,
					hooks
						.filter((hook) => hook.name.trim() && hook.url.trim())
						.map((hook) => ({ name: hook.name.trim(), url: hook.url.trim() })),
				]),
			);

			updatePayload.options[deployHooksOptionKey] = hooksByProject;
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

		if (updatePayload.options) {
			config.value.options = updatePayload.options;
		}

		configurationEdits.value = {};
		initialProjectIds.value = [...selectedProjectIds.value];
		projectsToRemove.value = [];

		// Snapshot deploy hooks as the new initial state
		const hooksSnapshot: Record<string, DeployHookEntry[]> = {};

		for (const [externalId, hooks] of Object.entries(projectDeployHooks)) {
			hooksSnapshot[externalId] = (hooks ?? []).map((h) => ({ ...h }));
		}

		initialProjectDeployHooks.value = hooksSnapshot;

		// Navigate to dashboard if we have projects
		if (selectedProjectIds.value.length > 0) {
			router.push({ name: 'deployments-provider-dashboard', params: { provider: props.provider } });
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
		router.push({ name: 'deployments-overview' });
	} catch (error) {
		unexpectedError(error);
	} finally {
		deleting.value = false;
	}
}

onMounted(() => {
	loadConfig();
});

watch(
	() => props.provider,
	() => {
		configurationEdits.value = {};

		for (const key of Object.keys(projectDeployHooks)) {
			delete projectDeployHooks[key];
		}

		initialProjectDeployHooks.value = {};
		expandedHookProjects.value = new Set();
		loadConfig();
	},
);
</script>

<template>
	<PrivateView
		:title="$t('deployment.provider.settings.settings', { provider: $t(`deployment.provider.${provider}.name`) })"
		:icon="initialProjectIds.length > 0 ? 'settings' : undefined"
		show-back
		:back-to="initialProjectIds.length > 0 ? `/deployments/${provider}` : '/deployments'"
	>
		<template #navigation>
			<DeploymentNavigation />
		</template>

		<template #actions>
			<PrivateViewHeaderBarActionButton
				v-if="canDelete"
				v-tooltip.bottom="$t('deployment.provider.settings.delete')"
				icon="delete"
				kind="danger"
				variant="ghost"
				@click="confirmDelete = true"
			/>
		</template>

		<template #actions:primary>
			<PrivateViewHeaderBarActionButton
				v-if="canUpdate || canManageProjects"
				:label="$t('save')"
				:disabled="!hasEdits"
				:loading="saving"
				icon="check"
				@click="checkSave"
			/>
		</template>

		<VProgressCircular v-if="loading" class="spinner" indeterminate />

		<div v-else class="container with-fill">
			<VNotice v-if="providerConfig?.settingsWarning && initialProjectIds.length > 0" type="warning" class="field full">
				{{ providerConfig.settingsWarning }}
			</VNotice>

			<VNotice v-if="showDeployHookSetupNotice" type="info" class="field full">
				<div>{{ $t('deployment.provider.cloudflare-workers.setup_requirements') }}</div>
			</VNotice>

			<InterfacePresentationDivider
				:title="$t('deployment.provider.settings.edit_configuration')"
				icon="settings"
				class="field full"
			/>

			<VForm
				v-model="configurationEdits"
				:fields="allFields as any"
				:initial-values="config?.options || {}"
				primary-key="+"
				class="credentials-saved field full"
			/>

			<template v-if="canManageProjects">
				<InterfacePresentationDivider
					:title="$t('deployment.provider.projects')"
					icon="assignment"
					class="field full"
				/>

				<div class="field full">
					<div class="type-label">{{ $t('deployment.provider.select_projects') }}</div>
					<div class="checkboxes">
						<div v-for="project in availableProjects" :key="project.external_id" class="project-row">
							<VCheckbox
								block
								:value="project.external_id"
								:label="project.name"
								:disabled="!project.deployable"
								:model-value="selectedProjectIds"
								@update:model-value="(value) => (selectedProjectIds = value)"
							>
								<template v-if="!project.deployable" #append>
									<span v-if="getProjectDeployableStatus(provider)" class="project-status">
										{{ $t(getProjectDeployableStatus(provider)!) }}
									</span>
									<VIcon v-tooltip.left="$t(getProjectDeployableHint(provider))" name="info" />
								</template>
							</VCheckbox>

							<div
								v-if="showDeployHookSetupNotice && selectedProjectIds.includes(project.external_id)"
								class="deploy-hooks-section"
							>
								<button class="deploy-hooks-toggle" @click="toggleHookExpansion(project.external_id)">
									<VIcon
										:name="expandedHookProjects.has(project.external_id) ? 'expand_more' : 'chevron_right'"
										small
									/>
									<span class="type-label">
										{{ $t('deployment.provider.cloudflare-workers.deploy_hooks.title') }}
										<span v-if="(projectDeployHooks[project.external_id] ?? []).length > 0" class="hook-count">
											({{ (projectDeployHooks[project.external_id] ?? []).length }})
										</span>
									</span>
								</button>

								<div v-if="expandedHookProjects.has(project.external_id)" class="deploy-hooks-content">
									<small class="type-note">
										{{ $t('deployment.provider.cloudflare-workers.deploy_hooks.hint') }}
									</small>

									<div
										v-for="(hook, index) in projectDeployHooks[project.external_id] ?? []"
										:key="index"
										class="deploy-hook-row"
									>
										<VInput
											v-model="hook.name"
											:placeholder="$t('deployment.provider.cloudflare-workers.deploy_hooks.name_placeholder')"
											small
											class="hook-name-input"
										/>

										<VInput
											v-model="hook.url"
											:placeholder="$t('deployment.provider.cloudflare-workers.deploy_hooks.url_placeholder')"
											small
											class="hook-url-input"
										/>

										<VButton
											v-tooltip="$t('delete_label')"
											x-small
											rounded
											icon
											secondary
											@click="removeDeployHook(project.external_id, index)"
										>
											<VIcon name="close" x-small />
										</VButton>
									</div>

									<VButton small secondary @click="addDeployHook(project.external_id)">
										<VIcon name="add" small />
										{{ $t('deployment.provider.cloudflare-workers.deploy_hooks.add') }}
									</VButton>
								</div>
							</div>
						</div>
					</div>
					<small class="type-note">{{ $t('deployment.provider.select_projects_hint') }}</small>
				</div>
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
@use '@/styles/mixins';

.container {
	@include mixins.form-grid;

	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);

	> :first-child.presentation-divider {
		margin-block-start: 0;
	}
}

.spinner {
	margin: 6.75rem auto;
}

.credentials-saved :deep([data-field='access_token']) {
	--v-input-placeholder-color: var(--theme--primary);
}

.checkboxes {
	display: grid;
	gap: 0.4375rem;
	padding-block: 0.125rem;
}

.project-status {
	color: var(--theme--foreground-subdued);
	font-size: 0.75rem;
	white-space: nowrap;
}

.project-row {
	display: flex;
	flex-direction: column;
}

.deploy-hooks-section {
	margin-inline-start: 2rem;
	margin-block: 0.25rem 0.5rem;
}

.deploy-hooks-toggle {
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0;
	border: none;
	background: none;
	cursor: pointer;
	color: var(--theme--foreground-subdued);
	font-size: 0.875rem;

	&:hover {
		color: var(--theme--foreground);
	}
}

.hook-count {
	color: var(--theme--foreground-subdued);
	font-weight: 400;
}

.deploy-hooks-content {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-block-start: 0.5rem;
	padding-inline-start: 0.25rem;
}

.deploy-hook-row {
	display: flex;
	gap: 0.5rem;
	align-items: center;
	inline-size: 100%;
}

.hook-name-input {
	flex: 0 0 15rem;
	max-inline-size: 18rem;
}

.hook-url-input {
	flex: 1 1 auto;
	min-inline-size: 16rem;
}

.container :deep(.v-notice a) {
	color: var(--theme--primary);
}
</style>

<script setup lang="ts">
import { useShortcut } from '@directus/composables';
import { DIRECTUS_SECURITY_BEST_PRACTICES_URL } from '@directus/constants';
import { Policy } from '@directus/types';
import { groupBy } from 'lodash-es';
import { computed, ref, toRefs } from 'vue';
import { I18nT } from 'vue-i18n';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';
import { getSystemPermissionChanges } from './get-system-permission-changes';
import PolicyInfoSidebarDetail from './policy-info-sidebar-detail.vue';
import { useIsAttachedToPublicRole } from './use-is-attached-to-public-role';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import VNotice from '@/components/v-notice.vue';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useItem } from '@/composables/use-item';
import { useUserStore } from '@/stores/user';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
import RevisionsSidebarDetail from '@/views/private/components/revisions-sidebar-detail.vue';
import SaveOptions from '@/views/private/components/save-options.vue';

const props = defineProps<{
	primaryKey: string;
	permissionKey?: string;
}>();

const router = useRouter();

const userStore = useUserStore();
const { primaryKey } = toRefs(props);

const revisionsSidebarDetailRef = ref<InstanceType<typeof RevisionsSidebarDetail> | null>(null);

const { edits, hasEdits, item, saving, loading, save, remove, deleting, validationErrors } = useItem<Policy>(
	ref('directus_policies'),
	primaryKey,
);

const isAttachedToPublicRole = useIsAttachedToPublicRole(primaryKey);

const { confirmSystemPermissions, systemPermissionActions, hasUnfilteredRead, guardSave, confirmSave } =
	useSystemPermissionsGuard();

const confirmDelete = ref(false);

useShortcut('meta+s', () => {
	if (hasEdits.value) guardSave(saveAndStay);
});

useShortcut('meta+shift+s', () => {
	if (hasEdits.value) guardSave(saveAndAddNew);
});

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

/**
 * @NOTE
 * The userStore contains the information about the role of the current user. We want to
 * update the userStore to make sure the role information is accurate with the latest changes
 * in case we're changing the current user's role
 */

async function saveAndStay() {
	try {
		await save();
		revisionsSidebarDetailRef.value?.refresh?.();
		await userStore.hydrate();
	} catch {
		// 'save' shows unexpected error dialog
	}
}

async function saveAndAddNew() {
	try {
		await save();
		await userStore.hydrate();
		router.push({ name: 'settings-add-new-policy' });
	} catch {
		// `save` shows unexpected error dialog
	}
}

async function saveAndQuit() {
	try {
		await save();
		await userStore.hydrate();
		router.push({ name: 'settings-policies-collection' });
	} catch {
		// 'save' shows unexpected error dialog
	}
}

async function deleteAndQuit() {
	if (deleting.value) return;

	try {
		await remove();
		edits.value = {};
		router.replace({ name: 'settings-policies-collection' });
	} catch {
		// 'remove' shows unexpected error dialog
	}
}

function discardAndLeave() {
	if (!leaveTo.value) return;
	edits.value = {};
	confirmLeave.value = false;
	router.push(leaveTo.value);
}

function discardAndStay() {
	edits.value = {};
	confirmLeave.value = false;
}

function useSystemPermissionsGuard() {
	const pendingSave = ref<(() => Promise<void>) | null>(null);

	const confirmSystemPermissions = computed({
		get: () => pendingSave.value !== null,
		set: (value) => {
			if (!value) {
				pendingSave.value = null;
			}
		},
	});

	const systemPermissionChanges = computed(() =>
		isAttachedToPublicRole.value ? getSystemPermissionChanges(edits.value.permissions) : [],
	);

	const systemPermissionActions = computed(() =>
		Object.entries(groupBy(systemPermissionChanges.value, 'collection')).map(([collection, changes]) => ({
			collection,
			actions: changes.map(({ action }) => action),
		})),
	);

	const hasUnfilteredRead = computed(() => systemPermissionChanges.value.some(({ unfilteredRead }) => unfilteredRead));

	return { confirmSystemPermissions, systemPermissionActions, hasUnfilteredRead, guardSave, confirmSave };

	function guardSave(saveFn: () => Promise<void>) {
		if (saving.value) {
			return;
		}

		if (systemPermissionChanges.value.length === 0) {
			saveFn();
			return;
		}

		pendingSave.value = saveFn;
	}

	async function confirmSave() {
		if (saving.value) {
			return;
		}

		await pendingSave.value?.();
		pendingSave.value = null;
	}
}
</script>

<template>
	<PrivateView
		:title="loading ? $t('loading') : $t('editing_policy', { policy: item && item.name })"
		show-back
		back-to="/settings/policies"
	>
		<template #actions>
			<VDialog v-model="confirmDelete" @esc="confirmDelete = false" @apply="deleteAndQuit">
				<template #activator="{ on }">
					<PrivateViewHeaderBarActionButton
						v-tooltip.bottom="$t('delete_label')"
						kind="danger"
						variant="ghost"
						:disabled="item === null"
						icon="delete"
						@click="on"
					/>
				</template>

				<VCard>
					<VCardTitle>{{ $t('delete_are_you_sure') }}</VCardTitle>

					<VCardActions>
						<VButton secondary @click="confirmDelete = false">
							{{ $t('cancel') }}
						</VButton>
						<VButton kind="danger" :loading="deleting" @click="deleteAndQuit">
							{{ $t('delete_label') }}
						</VButton>
					</VCardActions>
				</VCard>
			</VDialog>
		</template>

		<template #actions:primary>
			<PrivateViewHeaderBarActionButton
				:label="$t('save')"
				icon="check"
				:loading="saving"
				:disabled="!hasEdits"
				@click="guardSave(saveAndQuit)"
			>
				<template #split-menu>
					<SaveOptions
						:disabled-options="['save-and-quit', 'save-as-copy']"
						@save-and-stay="guardSave(saveAndStay)"
						@save-and-add-new="guardSave(saveAndAddNew)"
						@discard-and-stay="discardAndStay"
					/>
				</template>
			</PrivateViewHeaderBarActionButton>
		</template>

		<template #navigation>
			<SettingsNavigation />
		</template>

		<div class="content">
			<VNotice v-if="isAttachedToPublicRole" class="public-policy-notice" type="warning">
				<I18nT keypath="public_policy_warning" tag="span">
					<template #docs>
						<a :href="DIRECTUS_SECURITY_BEST_PRACTICES_URL" target="_blank" rel="noopener noreferrer">
							{{ $t('public_policy_warning_docs_link') }}
						</a>
					</template>
				</I18nT>
			</VNotice>

			<VForm
				v-model="edits"
				collection="directus_policies"
				:primary-key="primaryKey"
				:loading
				:initial-values="item"
				:validation-errors="validationErrors"
			/>
		</div>

		<template #sidebar>
			<PolicyInfoSidebarDetail :policy="item" />
			<RevisionsSidebarDetail
				ref="revisionsSidebarDetailRef"
				collection="directus_policies"
				:primary-key="primaryKey"
			/>
		</template>

		<VDialog v-model="confirmSystemPermissions" @esc="confirmSystemPermissions = false" @apply="confirmSave">
			<VCard class="system-permissions-card">
				<VCardTitle>{{ $t('public_policy_dialog.title') }}</VCardTitle>
				<VCardText class="system-permissions-confirm">
					<p>{{ $t('public_policy_dialog.copy') }}</p>

					<table class="system-permissions-table">
						<thead>
							<tr>
								<th scope="col">{{ $t('collection') }}</th>
								<th scope="col">{{ $t('actions') }}</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="{ collection, actions } in systemPermissionActions" :key="collection">
								<td class="collection">{{ collection }}</td>
								<td class="actions">{{ actions.map((action) => $t(action)).join(', ') }}</td>
							</tr>
						</tbody>
					</table>

					<VNotice v-if="hasUnfilteredRead" type="danger">
						{{ $t('public_policy_dialog.unfiltered_read_warning') }}
					</VNotice>

					<I18nT keypath="public_policy_dialog.best_practices" tag="p">
						<template #docs>
							<a :href="DIRECTUS_SECURITY_BEST_PRACTICES_URL" target="_blank" rel="noopener noreferrer">
								{{ $t('public_policy_warning_docs_link') }}
							</a>
						</template>
					</I18nT>
				</VCardText>
				<VCardActions>
					<VButton secondary @click="confirmSystemPermissions = false">
						{{ $t('cancel') }}
					</VButton>
					<VButton :loading="saving" @click="confirmSave">
						{{ $t('save') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

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

<style lang="scss" scoped>
.header-icon {
	--v-button-background-color: var(--theme--primary-background);
	--v-button-color: var(--theme--primary);
	--v-button-background-color-hover: var(--theme--primary-subdued);
	--v-button-color-hover: var(--theme--primary);
}

.content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
	display: flex;
	flex-direction: column;
	row-gap: var(--theme--form--row-gap);
}

.system-permissions-card {
	max-inline-size: unset;
	inline-size: min(39rem, calc(100vw - 2.25rem));
}

.system-permissions-confirm {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;

	a {
		text-decoration: underline;
		color: var(--theme--primary);
	}
}

.system-permissions-table {
	inline-size: 100%;
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	border-spacing: 0;

	th,
	td {
		padding: 0.5rem 0.6875rem;
		text-align: start;
		vertical-align: top;
	}

	th {
		font-weight: 600;
		background-color: var(--theme--form--field--input--background);
		border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);

		&:first-child {
			border-start-start-radius: var(--theme--border-radius);
		}

		&:last-child {
			border-start-end-radius: var(--theme--border-radius);
		}
	}

	tr + tr td {
		border-block-start: var(--theme--border-width) solid var(--theme--border-color-subdued);
	}

	.collection {
		font-family: var(--theme--fonts--monospace--font-family);
		overflow-wrap: break-word;
	}

	.actions {
		color: var(--theme--foreground-subdued);
	}
}

.public-policy-notice {
	max-inline-size: calc(var(--form-column-max-width) * 2 + var(--theme--form--column-gap));

	a {
		text-decoration: underline;
		color: var(--theme--primary);
	}
}
</style>

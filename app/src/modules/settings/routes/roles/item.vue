<script setup lang="ts">
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useItem } from '@/composables/use-item';
import { useShortcut } from '@/composables/use-shortcut';
import { useServerStore } from '@/stores/server';
import { useUserStore } from '@/stores/user';
import RevisionsSidebarDetail from '@/views/private/components/revisions-sidebar-detail.vue';
import SaveOptions from '@/views/private/components/save-options.vue';
import UsersInvite from '@/views/private/components/users-invite.vue';
import { Role } from '@directus/types';
import { computed, ref, toRefs } from 'vue';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';
import RoleInfoSidebarDetail from './role-info-sidebar-detail.vue';

const props = defineProps<{
	primaryKey: string;
	permissionKey?: string;
}>();


const router = useRouter();

const userStore = useUserStore();
const serverStore = useServerStore();
const userInviteModalActive = ref(false);
const { primaryKey } = toRefs(props);

const revisionsSidebarDetailRef = ref<InstanceType<typeof RevisionsSidebarDetail> | null>(null);

const { edits, hasEdits, item, saving, loading, save, remove, deleting, validationErrors } = useItem<Role>(
	ref('directus_roles'),
	primaryKey,
	{
		deep: { users: { _limit: 0 } },
	},
);

const canInviteUsers = computed(() => !serverStore.auth.disableDefault);

const confirmDelete = ref(false);

useShortcut('meta+s', () => {
	if (hasEdits.value) saveAndStay();
});

useShortcut('meta+shift+s', () => {
	if (hasEdits.value) saveAndAddNew();
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
		await userStore.hydrate();
		revisionsSidebarDetailRef.value?.refresh?.();
	} catch {
		// `save` shows unexpected error dialog
	}
}

async function saveAndAddNew() {
	try {
		await save();
		await userStore.hydrate();
		router.push(`/settings/roles/+`);
	} catch {
		// `save` shows unexpected error dialog
	}
}

async function saveAndQuit() {
	try {
		await save();
		await userStore.hydrate();
		router.push(`/settings/roles`);
	} catch {
		// `save` shows unexpected error dialog
	}
}

async function deleteAndQuit() {
	if (deleting.value) return;

	try {
		await remove();
		edits.value = {};
		router.replace(`/settings/roles`);
	} catch {
		// `remove` shows unexpected error dialog
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
</script>

<template>
	<private-view :title="loading ? $t('loading') : $t('editing_role', { role: item && item.name })">
		<template #headline>
			<v-breadcrumb :items="[{ name: $t('settings_roles'), to: '/settings/roles' }]" />
		</template>
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact :to="`/settings/roles/`">
				<v-icon name="arrow_back" />
			</v-button>
		</template>
		<template #actions>
			<v-dialog v-model="confirmDelete" @esc="confirmDelete = false" @apply="deleteAndQuit">
				<template #activator="{ on }">
					<v-button
						v-tooltip.bottom="$t('delete_label')"
						rounded
						icon
						class="action-delete"
						secondary
						:disabled="item === null"
						@click="on"
					>
						<v-icon name="delete" />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ $t('delete_are_you_sure') }}</v-card-title>

					<v-card-actions>
						<v-button secondary @click="confirmDelete = false">
							{{ $t('cancel') }}
						</v-button>
						<v-button kind="danger" :loading="deleting" @click="deleteAndQuit">
							{{ $t('delete_label') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button
				v-if="canInviteUsers"
				v-tooltip.bottom="$t('invite_users')"
				rounded
				icon
				secondary
				@click="userInviteModalActive = true"
			>
				<v-icon name="person_add" />
			</v-button>

			<v-button rounded icon :tooltip="t('save')" :loading="saving" :disabled="!hasEdits" @click="saveAndQuit">
				<v-icon name="check" />

				<template #append-outer>
					<save-options
						v-if="hasEdits"
						:disabled-options="['save-as-copy']"
						@save-and-stay="saveAndStay"
						@save-and-add-new="saveAndAddNew"
						@discard-and-stay="discardAndStay"
					/>
				</template>
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<users-invite v-model="userInviteModalActive" :role="primaryKey" />

		<div class="content">
			<v-form
				v-model="edits"
				collection="directus_roles"
				:primary-key="primaryKey"
				:loading
				:initial-values="item"
				:validation-errors="validationErrors"
			/>
		</div>

		<template #sidebar>
			<role-info-sidebar-detail :role="item" />
			<revisions-sidebar-detail ref="revisionsSidebarDetailRef" collection="directus_roles" :primary-key="primaryKey" />
		</template>

		<v-dialog v-model="confirmLeave" @esc="confirmLeave = false" @apply="discardAndLeave">
			<v-card>
				<v-card-title>{{ $t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ $t('unsaved_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="discardAndLeave">
						{{ $t('discard_changes') }}
					</v-button>
					<v-button @click="confirmLeave = false">{{ $t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</private-view>
</template>

<style lang="scss" scoped>
.header-icon {
	--v-button-background-color: var(--theme--primary-background);
	--v-button-color: var(--theme--primary);
	--v-button-background-color-hover: var(--theme--primary-subdued);
	--v-button-color-hover: var(--theme--primary);
}

.action-delete {
	--v-button-background-color-hover: var(--theme--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}
</style>

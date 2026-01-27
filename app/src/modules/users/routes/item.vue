<script setup lang="ts">
import { useCollection } from '@directus/composables';
import type { User } from '@directus/types';
import { computed, provide, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import UsersNavigation from '../components/navigation.vue';
import UserInfoSidebarDetail from '../components/user-info-sidebar-detail.vue';
import { logout } from '@/auth';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VChip from '@/components/v-chip.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VImage from '@/components/v-image.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import { useCollab } from '@/composables/use-collab';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useItem } from '@/composables/use-item';
import { useShortcut } from '@/composables/use-shortcut';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useServerStore } from '@/stores/server';
import { useUserStore } from '@/stores/user';
import { getAssetUrl } from '@/utils/get-asset-url';
import { userName } from '@/utils/user-name';
import { PrivateView } from '@/views/private';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import CommentsSidebarDetail from '@/views/private/components/comments-sidebar-detail.vue';
import ComparisonModal from '@/views/private/components/comparison/comparison-modal.vue';
import HeaderCollab from '@/views/private/components/HeaderCollab.vue';
import RevisionsSidebarDetail from '@/views/private/components/revisions-sidebar-detail.vue';
import SaveOptions from '@/views/private/components/save-options.vue';

const props = defineProps<{
	primaryKey: string;
	role?: string;
}>();

const { t, locale } = useI18n();

const router = useRouter();

const form = ref<HTMLElement>();
const fieldsStore = useFieldsStore();
const collectionsStore = useCollectionsStore();
const userStore = useUserStore();
const serverStore = useServerStore();

const { primaryKey } = toRefs(props);
const { breadcrumb } = useBreadcrumb();

const { info: collectionInfo } = useCollection('directus_users');

const revisionsSidebarDetail = ref<InstanceType<typeof RevisionsSidebarDetail> | null>(null);

const {
	isNew,
	edits,
	hasEdits,
	item,
	permissions,
	saving,
	loading,
	save,
	remove,
	deleting,
	saveAsCopy,
	archive,
	archiving,
	isArchived,
	validationErrors,
	refresh,
	getItem,
} = useItem<User>(
	ref('directus_users'),
	primaryKey,
	props.primaryKey !== '+'
		? {
				fields: ['*', 'role.*', 'avatar.id', 'avatar.modified_on'],
			}
		: undefined,
);

const {
	users: collabUsers,
	connected,
	collabContext,
	collabCollision,
	update: updateCollab,
	clearCollidingChanges,
	discard: discardCollab,
} = useCollab(ref('directus_users'), primaryKey, ref(null), item, edits, getItem);

const {
	collectionPermissions: { createAllowed, revisionsAllowed },
	itemPermissions: { updateAllowed, deleteAllowed, saveAllowed, archiveAllowed, fields },
} = permissions;

const user = computed(() => ({ ...item.value, role: item.value?.role?.id }));

if (props.role) {
	edits.value = {
		role: props.role,
		...edits.value,
	};
}

const isSavable = computed(() => saveAllowed.value && hasEdits.value);

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

const confirmDelete = ref(false);
const confirmArchive = ref(false);
const confirmDiscard = ref(false);

// Provide the discard functionality to field interfaces
provide('discardAllChanges', discardAndStay);

const avatarSrc = computed(() => {
	if (!item.value?.avatar) return null;

	return getAssetUrl(item.value.avatar.id, {
		imageKey: 'system-medium-cover',
		cacheBuster: item.value.avatar.modified_on,
	});
});

const avatarError = ref(null);

const title = computed(() => {
	if (loading.value === true) return t('loading');

	if (isNew.value === false && item.value) {
		const user = item.value as any;
		return userName(user);
	}

	return t('adding_user');
});

// These fields will be shown in the sidebar instead
const fieldsDenyList = ['id', 'last_page', 'created_on', 'created_by', 'modified_by', 'modified_on', 'last_access'];

const fieldsFiltered = computed(() => {
	return fields.value.filter((field) => {
		// These fields should only be editable when creating new users or by administrators
		if (!isNew.value && ['provider', 'external_identifier'].includes(field.field) && !userStore.isAdmin) {
			field.meta.readonly = true;
		}

		return !fieldsDenyList.includes(field.field);
	});
});

const archiveTooltip = computed(() => {
	if (archiveAllowed.value === false) return t('not_allowed');
	if (isArchived.value === true) return t('unarchive');
	return t('archive');
});

useShortcut('meta+s', saveAndStay, form);
useShortcut('meta+shift+s', saveAndAddNew, form);

function useBreadcrumb() {
	const breadcrumb = computed(() => [
		{
			name: t('user_directory'),
			to: `/users`,
		},
	]);

	return { breadcrumb };
}

async function saveAndQuit() {
	try {
		const savedItem: Record<string, any> = await save();
		await setLang(savedItem);
		await refreshCurrentUser();
		router.push(`/users`);
	} catch {
		// `save` will show unexpected error dialog
	}
}

async function saveAndStay() {
	try {
		const savedItem: Record<string, any> = await save();
		await setLang(savedItem);
		await refreshCurrentUser();

		if (props.primaryKey === '+') {
			const newPrimaryKey = savedItem.id;
			router.replace(`/users/${newPrimaryKey}`);
		} else {
			revisionsSidebarDetail.value?.refresh?.();
			refresh();
		}
	} catch {
		// `save` will show unexpected error dialog
	}
}

async function saveAndAddNew() {
	try {
		const savedItem: Record<string, any> = await save();
		await setLang(savedItem);
		await refreshCurrentUser();
		router.push(`/users/+`);
	} catch {
		// `save` will show unexpected error dialog
	}
}

async function saveAsCopyAndNavigate() {
	try {
		const newPrimaryKey = await saveAsCopy();
		if (newPrimaryKey) router.push(`/users/${newPrimaryKey}`);
	} catch {
		// `save` will show unexpected error dialog
	}
}

async function deleteAndQuit() {
	if (deleting.value) return;

	try {
		const currentUserId = userStore.currentUser && 'id' in userStore.currentUser ? userStore.currentUser.id : null;

		// If the deleted user is the current user, we want to log them out
		if (currentUserId && currentUserId === item.value?.id) {
			await remove();
			await logout();
			return;
		}

		await remove();
		edits.value = {};
		router.replace(`/users`);
	} catch {
		// `remove` will show the unexpected error dialog
	}
}

async function setLang(user: Record<string, any>) {
	if (userStore.currentUser!.id !== item.value?.id) return;

	const newLang = user?.language ?? serverStore.info?.project?.default_language;

	if (newLang && newLang !== locale.value) {
		await Promise.all([fieldsStore.hydrate(), collectionsStore.hydrate()]);
	}
}

async function refreshCurrentUser() {
	if (userStore.currentUser!.id === item.value?.id) {
		await userStore.hydrate();
	}
}

function discardAndLeave() {
	if (!leaveTo.value) return;
	edits.value = {};
	confirmLeave.value = false;
	router.push(leaveTo.value);
}

function discardAndStay() {
	if (collabUsers.value.length > 1) {
		confirmDiscard.value = true;
	} else {
		discardAndStayConfirmed();
	}
}

function discardAndStayConfirmed() {
	discardCollab();
	confirmLeave.value = false;
	confirmDiscard.value = false;
}

async function toggleArchive() {
	if (archiving.value) return;

	await archive();

	if (isArchived.value === true) {
		router.push('/users');
	} else {
		confirmArchive.value = false;
	}
}

function revert(values: Record<string, any>) {
	edits.value = {
		...edits.value,
		...values,
	};
}
</script>

<template>
	<PrivateView :title="title" show-back back-to="/users">
		<template #headline>
			<VBreadcrumb :items="breadcrumb" />
		</template>

		<template #actions>
			<HeaderCollab :model-value="collabUsers" :connected="connected" />
			<VDialog
				v-model="confirmDelete"
				:disabled="deleteAllowed === false"
				@esc="confirmDelete = false"
				@apply="deleteAndQuit"
			>
				<template #activator="{ on }">
					<PrivateViewHeaderBarActionButton
						v-tooltip.bottom="deleteAllowed ? $t('delete_label') : $t('not_allowed')"
						class="action-delete"
						secondary
						:disabled="item === null || deleteAllowed !== true"
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

			<VDialog
				v-if="collectionInfo.meta && collectionInfo.meta.archive_field && !isNew"
				v-model="confirmArchive"
				:disabled="archiveAllowed === false"
				@esc="confirmArchive = false"
				@apply="toggleArchive"
			>
				<template #activator="{ on }">
					<PrivateViewHeaderBarActionButton
						v-if="collectionInfo.meta && collectionInfo.meta.singleton === false"
						v-tooltip.bottom="archiveTooltip"
						secondary
						:disabled="item === null || archiveAllowed !== true"
						:icon="isArchived ? 'unarchive' : 'archive'"
						@click="on"
					/>
				</template>

				<VCard>
					<VCardTitle>{{ isArchived ? $t('unarchive_confirm') : $t('archive_confirm') }}</VCardTitle>

					<VCardActions>
						<VButton secondary @click="confirmArchive = false">
							{{ $t('cancel') }}
						</VButton>
						<VButton kind="warning" :loading="archiving" @click="toggleArchive">
							{{ isArchived ? $t('unarchive') : $t('archive') }}
						</VButton>
					</VCardActions>
				</VCard>
			</VDialog>

			<PrivateViewHeaderBarActionButton
				v-tooltip.bottom="saveAllowed ? $t('save') : $t('not_allowed')"
				:loading="saving"
				:disabled="!isSavable"
				icon="check"
				@click="saveAndQuit"
			>
				<template #append-outer>
					<SaveOptions
						v-if="isSavable"
						:disabled-options="createAllowed ? [] : ['save-and-add-new', 'save-as-copy']"
						@save-and-stay="saveAndStay"
						@save-and-add-new="saveAndAddNew"
						@save-as-copy="saveAsCopyAndNavigate"
						@discard-and-stay="discardAndStay"
					/>
				</template>
			</PrivateViewHeaderBarActionButton>
		</template>

		<template #navigation>
			<UsersNavigation :current-role="item?.role?.id ?? role" />
		</template>

		<div class="user-item">
			<div v-if="isNew === false" class="user-box">
				<div class="avatar">
					<VSkeletonLoader v-if="loading" />
					<VImage
						v-else-if="avatarSrc && !avatarError"
						:src="avatarSrc"
						:alt="$t('avatar')"
						@error="avatarError = $event"
					/>
					<VIcon v-else name="account_circle" x-large />
				</div>
				<div class="user-box-content">
					<template v-if="loading">
						<VSkeletonLoader type="text" />
						<VSkeletonLoader type="text" />
						<VSkeletonLoader type="text" />
					</template>
					<template v-else-if="isNew === false && item">
						<div class="name type-label">
							{{ userName(item) }}
							<span v-if="item.title" class="title">, {{ item.title }}</span>
						</div>
						<div v-if="item.email" class="email">
							<VIcon name="alternate_email" small />
							{{ item.email }}
						</div>
						<div v-if="item.location" class="location">
							<VIcon name="place" small />
							{{ item.location }}
						</div>
						<VChip v-if="item.role?.name" :class="item.status" small>{{ item.role.name }}</VChip>
					</template>
				</div>
			</div>

			<VForm
				ref="form"
				v-model="edits"
				:disabled="isNew ? false : updateAllowed === false"
				:fields="fieldsFiltered"
				:loading="loading"
				:initial-values="user"
				:primary-key="primaryKey"
				:collab-context="collabContext"
				:validation-errors="validationErrors"
			/>
		</div>

		<VDialog v-model="confirmLeave" @esc="confirmLeave = false" @apply="discardAndLeave">
			<VCard v-if="!connected">
				<VCardTitle>{{ $t('unsaved_changes') }}</VCardTitle>
				<VCardText>{{ $t('unsaved_changes_copy') }}</VCardText>
				<VCardActions>
					<VButton secondary @click="discardAndLeave">
						{{ $t('discard_changes') }}
					</VButton>
					<VButton @click="confirmLeave = false">{{ $t('keep_editing') }}</VButton>
				</VCardActions>
			</VCard>
			<VCard v-else>
				<VCardTitle>{{ $t('unsaved_changes_collab') }}</VCardTitle>
				<VCardText>{{ $t('unsaved_changes_copy_collab') }}</VCardText>
				<VCardActions>
					<VButton secondary @click="discardAndLeave">
						{{ $t('leave_page') }}
					</VButton>
					<VButton @click="confirmLeave = false">{{ $t('keep_editing') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

		<VDialog v-model="confirmDiscard" @esc="confirmDiscard = false">
			<VCard>
				<VCardTitle>{{ $t('discard_all_changes') }}</VCardTitle>
				<VCardText>{{ $t('discard_changes_copy_collab') }}</VCardText>
				<VCardActions>
					<VButton secondary @click="discardAndStayConfirmed">
						{{ $t('discard_changes') }}
					</VButton>
					<VButton @click="confirmDiscard = false">{{ $t('keep_editing') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

		<ComparisonModal
			:model-value="collabCollision !== undefined"
			collection="directus_users"
			:primary-key="primaryKey"
			:current-collab="collabCollision"
			:collab-context="collabContext"
			mode="collab"
			:delete-versions-allowed="false"
			:current-version="null"
			@confirm="updateCollab"
			@cancel="clearCollidingChanges"
		/>

		<template #sidebar>
			<UserInfoSidebarDetail :is-new="isNew" :user="item" />
			<RevisionsSidebarDetail
				v-if="isNew === false && revisionsAllowed"
				ref="revisionsSidebarDetail"
				collection="directus_users"
				:primary-key="primaryKey"
				@revert="revert"
			/>
			<CommentsSidebarDetail v-if="isNew === false" collection="directus_users" :primary-key="primaryKey" />
		</template>
	</PrivateView>
</template>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color-hover: var(--theme--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.header-icon.secondary {
	--v-button-background-color: var(--theme--background-normal);
}

.user-item {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}

.user-box {
	--v-skeleton-loader-background-color: var(--theme--background-normal);

	display: flex;
	align-items: center;
	max-inline-size: calc(var(--form-column-max-width) * 2 + var(--theme--form--column-gap));
	block-size: 112px;
	margin-block-end: var(--theme--form--row-gap);
	padding: 20px;
	background-color: var(--theme--background-normal);
	border-radius: calc(var(--theme--border-radius) + 4px);

	.avatar {
		--v-icon-color: var(--theme--foreground-subdued);

		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		inline-size: 84px;
		block-size: 84px;
		margin-inline-end: 16px;
		overflow: hidden;
		background-color: var(--theme--background-normal);
		border: solid 6px var(--white);
		border-radius: 100%;

		.v-skeleton-loader {
			inline-size: 100%;
			block-size: 100%;
		}

		img {
			inline-size: 100%;
			block-size: 100%;
			object-fit: cover;
		}

		@media (width > 640px) {
			inline-size: 144px;
			block-size: 144px;
			margin-inline-end: 22px;
		}
	}

	.user-box-content {
		flex-grow: 1;
		overflow: hidden;

		.v-skeleton-loader {
			inline-size: 175px;
		}

		.v-skeleton-loader:not(:last-child) {
			margin-block-end: 16px;
		}

		.v-chip {
			--v-chip-color: var(--theme--foreground-subdued);
			--v-chip-background-color: var(--theme--background-subdued);
			--v-chip-color-hover: var(--theme--foreground-subdued);
			--v-chip-background-color-hover: var(--theme--background-subdued);

			margin-block-start: 4px;

			&.active {
				--v-chip-color: var(--theme--primary);
				--v-chip-background-color: var(--theme--primary-subdued);
				--v-chip-color-hover: var(--theme--primary);
				--v-chip-background-color-hover: var(--theme--primary-subdued);
			}
		}

		.title,
		.email,
		.location {
			color: var(--theme--foreground-subdued);
		}

		.name {
			white-space: nowrap;
		}

		.location {
			display: none;
		}
	}

	@media (width > 640px) {
		block-size: 188px;

		.user-box-content .location {
			display: block;
		}
	}
}
</style>

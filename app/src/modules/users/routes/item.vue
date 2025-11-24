<script setup lang="ts">
import { logout } from '@/auth';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useItem } from '@/composables/use-item';
import { useShortcut } from '@/composables/use-shortcut';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useServerStore } from '@/stores/server';
import { useUserStore } from '@/stores/user';
import { getAssetUrl } from '@/utils/get-asset-url';
import { userName } from '@/utils/user-name';
import CommentsSidebarDetail from '@/views/private/components/comments-sidebar-detail.vue';
import RevisionsSidebarDetail from '@/views/private/components/revisions-sidebar-detail.vue';
import SaveOptions from '@/views/private/components/save-options.vue';
import { useCollection } from '@directus/composables';
import type { User } from '@directus/types';
import { computed, ref, toRefs, provide } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import UsersNavigation from '../components/navigation.vue';
import UserInfoSidebarDetail from '../components/user-info-sidebar-detail.vue';

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

function navigateBack() {
	const backState = router.options.history.state.back;

	if (typeof backState !== 'string' || !backState.startsWith('/login')) {
		router.back();
		return;
	}

	router.push('/users');
}

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
	edits.value = {};
	confirmLeave.value = false;
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
	<private-view :title="title">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon secondary exact @click="navigateBack">
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #actions>
			<v-dialog
				v-model="confirmDelete"
				:disabled="deleteAllowed === false"
				@esc="confirmDelete = false"
				@apply="deleteAndQuit"
			>
				<template #activator="{ on }">
					<v-button
						v-tooltip.bottom="deleteAllowed ? $t('delete_label') : $t('not_allowed')"
						rounded
						icon
						class="action-delete"
						secondary
						:disabled="item === null || deleteAllowed !== true"
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

			<v-dialog
				v-if="collectionInfo.meta && collectionInfo.meta.archive_field && !isNew"
				v-model="confirmArchive"
				:disabled="archiveAllowed === false"
				@esc="confirmArchive = false"
				@apply="toggleArchive"
			>
				<template #activator="{ on }">
					<v-button
						v-if="collectionInfo.meta && collectionInfo.meta.singleton === false"
						v-tooltip.bottom="archiveTooltip"
						rounded
						icon
						secondary
						:disabled="item === null || archiveAllowed !== true"
						@click="on"
					>
						<v-icon :name="isArchived ? 'unarchive' : 'archive'" />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ isArchived ? $t('unarchive_confirm') : $t('archive_confirm') }}</v-card-title>

					<v-card-actions>
						<v-button secondary @click="confirmArchive = false">
							{{ $t('cancel') }}
						</v-button>
						<v-button kind="warning" :loading="archiving" @click="toggleArchive">
							{{ isArchived ? $t('unarchive') : $t('archive') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button
				v-tooltip.bottom="saveAllowed ? $t('save') : $t('not_allowed')"
				rounded
				icon
				:loading="saving"
				:disabled="!isSavable"
				@click="saveAndQuit"
			>
				<v-icon name="check" />

				<template #append-outer>
					<save-options
						v-if="isSavable"
						:disabled-options="createAllowed ? [] : ['save-and-add-new', 'save-as-copy']"
						@save-and-stay="saveAndStay"
						@save-and-add-new="saveAndAddNew"
						@save-as-copy="saveAsCopyAndNavigate"
						@discard-and-stay="discardAndStay"
					/>
				</template>
			</v-button>
		</template>

		<template #navigation>
			<users-navigation :current-role="item?.role?.id ?? role" />
		</template>

		<div class="user-item">
			<div v-if="isNew === false" class="user-box">
				<div class="avatar">
					<v-skeleton-loader v-if="loading" />
					<v-image
						v-else-if="avatarSrc && !avatarError"
						:src="avatarSrc"
						:alt="$t('avatar')"
						@error="avatarError = $event"
					/>
					<v-icon v-else name="account_circle" x-large />
				</div>
				<div class="user-box-content">
					<template v-if="loading">
						<v-skeleton-loader type="text" />
						<v-skeleton-loader type="text" />
						<v-skeleton-loader type="text" />
					</template>
					<template v-else-if="isNew === false && item">
						<div class="name type-label">
							{{ userName(item) }}
							<span v-if="item.title" class="title">, {{ item.title }}</span>
						</div>
						<div v-if="item.email" class="email">
							<v-icon name="alternate_email" small />
							{{ item.email }}
						</div>
						<div v-if="item.location" class="location">
							<v-icon name="place" small />
							{{ item.location }}
						</div>
						<v-chip v-if="item.role?.name" :class="item.status" small>{{ item.role.name }}</v-chip>
					</template>
				</div>
			</div>

			<v-form
				ref="form"
				v-model="edits"
				:disabled="isNew ? false : updateAllowed === false"
				:fields="fieldsFiltered"
				:loading="loading"
				:initial-values="user"
				:primary-key="primaryKey"
				:validation-errors="validationErrors"
			/>
		</div>

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

		<template #sidebar>
			<user-info-sidebar-detail :is-new="isNew" :user="item" />
			<revisions-sidebar-detail
				v-if="isNew === false && revisionsAllowed"
				ref="revisionsSidebarDetail"
				collection="directus_users"
				:primary-key="primaryKey"
				@revert="revert"
			/>
			<comments-sidebar-detail v-if="isNew === false" collection="directus_users" :primary-key="primaryKey" />
		</template>
	</private-view>
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

		@media (min-width: 600px) {
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

	@media (min-width: 600px) {
		block-size: 188px;

		.user-box-content .location {
			display: block;
		}
	}
}
</style>

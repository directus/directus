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
			<v-dialog v-model="confirmDelete" :disabled="deleteAllowed === false" @esc="confirmDelete = false">
				<template #activator="{ on }">
					<v-button
						v-tooltip.bottom="deleteAllowed ? t('delete_label') : t('not_allowed')"
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
					<v-card-title>{{ t('delete_are_you_sure') }}</v-card-title>

					<v-card-actions>
						<v-button secondary @click="confirmDelete = false">
							{{ t('cancel') }}
						</v-button>
						<v-button kind="danger" :loading="deleting" @click="deleteAndQuit">
							{{ t('delete_label') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-dialog
				v-if="collectionInfo.meta && collectionInfo.meta.archive_field && !isNew"
				v-model="confirmArchive"
				:disabled="archiveAllowed === false"
				@esc="confirmArchive = false"
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
					<v-card-title>{{ isArchived ? t('unarchive_confirm') : t('archive_confirm') }}</v-card-title>

					<v-card-actions>
						<v-button secondary @click="confirmArchive = false">
							{{ t('cancel') }}
						</v-button>
						<v-button kind="warning" :loading="archiving" @click="toggleArchive">
							{{ isArchived ? t('unarchive') : t('archive') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button
				v-tooltip.bottom="saveAllowed ? t('save') : t('not_allowed')"
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
			<users-navigation :current-role="(item && item.role) || role" />
		</template>

		<div class="user-item">
			<div v-if="isNew === false" class="user-box">
				<div class="avatar">
					<v-skeleton-loader v-if="loading || previewLoading" />
					<v-image
						v-else-if="avatarSrc && !avatarError"
						:src="avatarSrc"
						:alt="t('avatar')"
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
						<v-chip v-if="roleName" :class="item.status" small>{{ roleName }}</v-chip>
					</template>
				</div>
			</div>

			<v-form
				ref="form"
				v-model="edits"
				:disabled="isNew ? false : updateAllowed === false"
				:fields="formFields"
				:loading="loading"
				:initial-values="item"
				:batch-mode="isBatch"
				:primary-key="primaryKey"
				:validation-errors="validationErrors"
			/>
		</div>

		<v-dialog v-model="confirmLeave" @esc="confirmLeave = false">
			<v-card>
				<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ t('unsaved_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="discardAndLeave">
						{{ t('discard_changes') }}
					</v-button>
					<v-button @click="confirmLeave = false">{{ t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<template #sidebar>
			<user-info-sidebar-detail :is-new="isNew" :user="item" />
			<revisions-drawer-detail
				v-if="isBatch === false && isNew === false && revisionsAllowed"
				ref="revisionsDrawerDetail"
				collection="directus_users"
				:primary-key="primaryKey"
				@revert="revert"
			/>
			<comments-sidebar-detail
				v-if="isBatch === false && isNew === false"
				collection="directus_users"
				:primary-key="primaryKey"
			/>
		</template>
	</private-view>
</template>

<script lang="ts">
import { computed, defineComponent, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import api from '@/api';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useFormFields } from '@/composables/use-form-fields';
import { useItem } from '@/composables/use-item';
import { usePermissions } from '@/composables/use-permissions';
import { useShortcut } from '@/composables/use-shortcut';
import { setLanguage } from '@/lang/set-language';
import { useUserStore } from '@/stores/user';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useServerStore } from '@/stores/server';
import { unexpectedError } from '@/utils/unexpected-error';
import { userName } from '@/utils/user-name';
import CommentsSidebarDetail from '@/views/private/components/comments-sidebar-detail.vue';
import RevisionsDrawerDetail from '@/views/private/components/revisions-drawer-detail.vue';
import SaveOptions from '@/views/private/components/save-options.vue';
import { useCollection } from '@directus/shared/composables';
import { Field } from '@directus/shared/types';
import { useRouter } from 'vue-router';
import UsersNavigation from '../components/navigation.vue';
import UserInfoSidebarDetail from '../components/user-info-sidebar-detail.vue';

export default defineComponent({
	name: 'UsersItem',
	components: { UsersNavigation, RevisionsDrawerDetail, SaveOptions, CommentsSidebarDetail, UserInfoSidebarDetail },
	props: {
		primaryKey: {
			type: String,
			required: true,
		},
		role: {
			type: String,
			default: null,
		},
	},
	setup(props) {
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

		const revisionsDrawerDetail = ref<InstanceType<typeof RevisionsDrawerDetail> | null>(null);

		const {
			isNew,
			edits,
			hasEdits,
			item,
			saving,
			loading,
			save,
			remove,
			deleting,
			saveAsCopy,
			isBatch,
			archive,
			archiving,
			isArchived,
			validationErrors,
		} = useItem(ref('directus_users'), primaryKey);

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

		const avatarError = ref(null);

		const title = computed(() => {
			if (loading.value === true) return t('loading');

			if (isNew.value === false && item.value) {
				const user = item.value as any;
				return userName(user);
			}

			return t('adding_user');
		});

		const { loading: previewLoading, avatarSrc, roleName } = useUserPreview();

		const { createAllowed, deleteAllowed, archiveAllowed, saveAllowed, updateAllowed, revisionsAllowed, fields } =
			usePermissions(ref('directus_users'), item, isNew);

		// These fields will be shown in the sidebar instead
		const fieldsDenyList = ['id', 'last_page', 'created_on', 'created_by', 'modified_by', 'modified_on', 'last_access'];

		const fieldsFiltered = computed(() => {
			return fields.value.filter((field: Field) => {
				// These fields should only be editable when creating new users or by administrators
				if (!isNew.value && ['provider', 'external_identifier'].includes(field.field) && !userStore.isAdmin) {
					field.meta.readonly = true;
				}
				return !fieldsDenyList.includes(field.field);
			});
		});

		const { formFields } = useFormFields(fieldsFiltered);

		const archiveTooltip = computed(() => {
			if (archiveAllowed.value === false) return t('not_allowed');
			if (isArchived.value === true) return t('unarchive');
			return t('archive');
		});

		useShortcut('meta+s', saveAndStay, form);
		useShortcut('meta+shift+s', saveAndAddNew, form);

		return {
			t,
			router,
			title,
			item,
			loading,
			isNew,
			navigateBack,
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
			discardAndStay,
			isBatch,
			revisionsDrawerDetail,
			previewLoading,
			avatarSrc,
			roleName,
			confirmLeave,
			leaveTo,
			discardAndLeave,
			formFields,
			createAllowed,
			deleteAllowed,
			saveAllowed,
			archiveAllowed,
			isArchived,
			updateAllowed,
			toggleArchive,
			confirmArchive,
			collectionInfo,
			archiving,
			archiveTooltip,
			form,
			userName,
			revisionsAllowed,
			validationErrors,
			revert,
			avatarError,
			isSavable,
		};

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

				revisionsDrawerDetail.value?.refresh?.();

				if (props.primaryKey === '+') {
					const newPrimaryKey = savedItem.id;
					router.replace(`/users/${newPrimaryKey}`);
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
			try {
				await remove();
				router.replace(`/users`);
			} catch {
				// `remove` will show the unexpected error dialog
			}
		}

		async function setLang(user: Record<string, any>) {
			if (userStore.currentUser!.id !== item.value?.id) return;

			const newLang = user?.language ?? serverStore.info?.project?.default_language;

			if (newLang && newLang !== locale.value) {
				await setLanguage(newLang);

				await Promise.all([fieldsStore.hydrate(), collectionsStore.hydrate()]);
			}
		}

		async function refreshCurrentUser() {
			if (userStore.currentUser!.id === item.value?.id) {
				await userStore.hydrate();
			}
		}

		function useUserPreview() {
			const loading = ref(false);
			const avatarSrc = ref<string | null>(null);
			const roleName = ref<string | null>(null);

			watch(() => props.primaryKey, getUserPreviewData, { immediate: true });

			return { loading, avatarSrc, roleName };

			async function getUserPreviewData() {
				if (props.primaryKey === '+') return;

				loading.value = true;

				try {
					const response = await api.get(`/users/${props.primaryKey}`, {
						params: {
							fields: ['role.name', 'avatar.id'],
						},
					});

					avatarSrc.value = response.data.data.avatar?.id
						? `/assets/${response.data.data.avatar.id}?key=system-medium-cover`
						: null;

					roleName.value = response.data.data?.role?.name;
				} catch (err: any) {
					unexpectedError(err);
				} finally {
					loading.value = false;
				}
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
	},
});
</script>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color-hover: var(--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.header-icon.secondary {
	--v-button-background-color: var(--background-normal);
}

.user-item {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}

.user-box {
	--v-skeleton-loader-background-color: var(--background-normal);

	display: flex;
	align-items: center;
	max-width: calc(var(--form-column-max-width) * 2 + var(--form-horizontal-gap));
	height: 112px;
	margin-bottom: var(--form-vertical-gap);
	padding: 20px;
	background-color: var(--background-normal);
	border-radius: calc(var(--border-radius) + 4px);

	.avatar {
		--v-icon-color: var(--foreground-subdued);

		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 84px;
		height: 84px;
		margin-right: 16px;
		overflow: hidden;
		background-color: var(--background-normal);
		border: solid 6px var(--white);
		border-radius: 100%;
		box-shadow: var(--card-shadow);

		.v-skeleton-loader {
			width: 100%;
			height: 100%;
		}

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		@media (min-width: 600px) {
			width: 144px;
			height: 144px;
			margin-right: 22px;
		}
	}

	.user-box-content {
		flex-grow: 1;
		overflow: hidden;

		.v-skeleton-loader {
			width: 175px;
		}

		.v-skeleton-loader:not(:last-child) {
			margin-bottom: 16px;
		}

		.v-chip {
			--v-chip-color: var(--foreground-subdued);
			--v-chip-background-color: var(--background-subdued);
			--v-chip-color-hover: var(--foreground-subdued);
			--v-chip-background-color-hover: var(--background-subdued);

			margin-top: 4px;

			&.active {
				--v-chip-color: var(--primary);
				--v-chip-background-color: var(--primary-25);
				--v-chip-color-hover: var(--primary);
				--v-chip-background-color-hover: var(--primary-25);
			}
		}

		.title,
		.email,
		.location {
			color: var(--foreground-subdued);
		}

		.name {
			white-space: nowrap;
		}

		.location {
			display: none;
		}
	}

	@media (min-width: 600px) {
		height: 188px;

		.user-box-content .location {
			display: block;
		}
	}
}
</style>

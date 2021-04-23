<template>
	<private-view :title="title">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon secondary exact @click="$router.back()">
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #actions>
			<v-dialog v-model="confirmDelete" @esc="confirmDelete = false" :disabled="deleteAllowed === false">
				<template #activator="{ on }">
					<v-button
						rounded
						icon
						class="action-delete"
						v-tooltip.bottom="deleteAllowed ? $t('delete') : $t('not_allowed')"
						:disabled="item === null || deleteAllowed !== true"
						@click="on"
					>
						<v-icon name="delete" outline />
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

			<v-dialog
				v-if="collectionInfo.meta && collectionInfo.meta.archive_field && !isNew"
				v-model="confirmArchive"
				@esc="confirmArchive = false"
				:disabled="archiveAllowed === false"
			>
				<template #activator="{ on }">
					<v-button
						rounded
						icon
						class="action-archive"
						v-tooltip.bottom="archiveTooltip"
						@click="on"
						:disabled="item === null || archiveAllowed !== true"
						v-if="collectionInfo.meta && collectionInfo.meta.singleton === false"
					>
						<v-icon :name="isArchived ? 'unarchive' : 'archive'" outline />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ isArchived ? $t('unarchive_confirm') : $t('archive_confirm') }}</v-card-title>

					<v-card-actions>
						<v-button @click="confirmArchive = false" secondary>
							{{ $t('cancel') }}
						</v-button>
						<v-button @click="toggleArchive" class="action-archive" :loading="archiving">
							{{ isArchived ? $t('unarchive') : $t('archive') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button
				rounded
				icon
				:loading="saving"
				:disabled="hasEdits === false || saveAllowed === false"
				v-tooltip.bottom="saveAllowed ? $t('save') : $t('not_allowed')"
				@click="saveAndQuit"
			>
				<v-icon name="check" />

				<template #append-outer>
					<save-options
						v-if="hasEdits === true"
						@save-and-stay="saveAndStay"
						@save-and-add-new="saveAndAddNew"
						@save-as-copy="saveAsCopyAndNavigate"
					/>
				</template>
			</v-button>
		</template>

		<template #navigation>
			<users-navigation :current-role="(item && item.role) || (preset && preset.role)" />
		</template>

		<div class="user-item">
			<div class="user-box" v-if="isNew === false">
				<div class="avatar">
					<v-skeleton-loader v-if="loading || previewLoading" />
					<img v-else-if="avatarSrc" :src="avatarSrc" :alt="item.email" />
					<v-icon v-else name="account_circle" outline x-large />
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
						<div class="email">
							<v-icon name="alternate_email" small outline />
							{{ item.email }}
						</div>
						<div class="location" v-if="item.location">
							<v-icon name="place" small outline />
							{{ item.location }}
						</div>
						<v-chip :class="item.status" small v-if="roleName">{{ roleName }}</v-chip>
					</template>
				</div>
			</div>

			<v-form
				ref="form"
				:disabled="isNew ? false : updateAllowed === false"
				:fields="formFields"
				:loading="loading"
				:initial-values="item"
				:batch-mode="isBatch"
				:primary-key="primaryKey"
				:validation-errors="validationErrors"
				v-model="edits"
			/>
		</div>

		<v-dialog v-model="confirmLeave" @esc="confirmLeave = false">
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
			<revisions-drawer-detail
				v-if="isBatch === false && isNew === false && revisionsAllowed"
				collection="directus_users"
				:primary-key="primaryKey"
				ref="revisionsDrawerDetail"
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
import { defineComponent, computed, toRefs, ref, watch } from '@vue/composition-api';

import UsersNavigation from '../components/navigation.vue';
import { i18n } from '@/lang';
import { setLanguage } from '@/lang/set-language';
import router from '@/router';
import RevisionsDrawerDetail from '@/views/private/components/revisions-drawer-detail';
import CommentsSidebarDetail from '@/views/private/components/comments-sidebar-detail';
import useItem from '@/composables/use-item';
import SaveOptions from '@/views/private/components/save-options';
import api from '@/api';
import { useFieldsStore, useCollectionsStore } from '@/stores/';
import useFormFields from '@/composables/use-form-fields';
import { Field } from '@/types';
import UserInfoSidebarDetail from '../components/user-info-sidebar-detail.vue';
import { getRootPath } from '@/utils/get-root-path';
import useShortcut from '@/composables/use-shortcut';
import useCollection from '@/composables/use-collection';
import { userName } from '@/utils/user-name';
import { usePermissions } from '@/composables/use-permissions';
import { unexpectedError } from '@/utils/unexpected-error';
import { addTokenToURL } from '@/api';
import { useUserStore } from '@/stores';
import unsavedChanges from '@/composables/unsaved-changes';

export default defineComponent({
	name: 'users-item',
	beforeRouteLeave(to, from, next) {
		const self = this as any;
		const hasEdits = Object.keys(self.edits).length > 0;

		if (hasEdits) {
			self.confirmLeave = true;
			self.leaveTo = to.fullPath;
			return next(false);
		}

		return next();
	},
	components: { UsersNavigation, RevisionsDrawerDetail, SaveOptions, CommentsSidebarDetail, UserInfoSidebarDetail },
	props: {
		primaryKey: {
			type: String,
			required: true,
		},
		preset: {
			type: Object,
			default: () => ({}),
		},
	},
	setup(props) {
		const form = ref<HTMLElement>();
		const fieldsStore = useFieldsStore();
		const collectionsStore = useCollectionsStore();
		const userStore = useUserStore();

		const { primaryKey } = toRefs(props);
		const { breadcrumb } = useBreadcrumb();

		const { info: collectionInfo } = useCollection(ref('directus_users'));

		const revisionsDrawerDetail = ref<Vue | null>(null);

		const {
			isNew,
			edits,
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

		if (props.preset) {
			edits.value = {
				...props.preset,
				...edits.value,
			};
		}

		const hasEdits = computed<boolean>(() => Object.keys(edits.value).length > 0);

		unsavedChanges(hasEdits);

		const confirmDelete = ref(false);
		const confirmArchive = ref(false);

		const title = computed(() => {
			if (loading.value === true) return i18n.t('loading');

			if (isNew.value === false && item.value) {
				const user = item.value as any;
				return userName(user);
			}

			return i18n.t('adding_user');
		});

		const { loading: previewLoading, avatarSrc, roleName } = useUserPreview();

		const confirmLeave = ref(false);
		const leaveTo = ref<string | null>(null);

		// These fields will be shown in the sidebar instead
		const fieldsBlacklist = [
			'id',
			'external_id',
			'last_page',
			'created_on',
			'created_by',
			'modified_by',
			'modified_on',
			'last_access',
		];

		const fieldsFiltered = computed(() => {
			return fieldsStore
				.getFieldsForCollection('directus_users')
				.filter((field: Field) => fieldsBlacklist.includes(field.field) === false);
		});

		const { formFields } = useFormFields(fieldsFiltered);

		const { deleteAllowed, archiveAllowed, saveAllowed, updateAllowed, revisionsAllowed } = usePermissions(
			ref('directus_users'),
			item,
			isNew
		);

		const archiveTooltip = computed(() => {
			if (archiveAllowed.value === false) return i18n.t('not_allowed');
			if (isArchived.value === true) return i18n.t('unarchive');
			return i18n.t('archive');
		});

		useShortcut('meta+s', saveAndStay, form);
		useShortcut('meta+shift+s', saveAndAddNew, form);

		return {
			title,
			item,
			loading,
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
			revisionsDrawerDetail,
			previewLoading,
			avatarSrc,
			roleName,
			confirmLeave,
			leaveTo,
			discardAndLeave,
			formFields,
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
		};

		function useBreadcrumb() {
			const breadcrumb = computed(() => [
				{
					name: i18n.t('user_directory'),
					to: `/users/`,
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

				revisionsDrawerDetail.value?.$data?.refresh?.();

				if (props.primaryKey === '+') {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
				router.push(`/users`);
			} catch {
				// `remove` will show the unexpected error dialog
			}
		}

		async function setLang(user: Record<string, any>) {
			if (userStore.state.currentUser!.id !== item.value?.id) return;

			const newLang = user?.language;

			if (newLang && newLang !== i18n.locale) {
				await setLanguage(newLang);

				await fieldsStore.hydrate();
				await collectionsStore.hydrate();
			}
		}

		async function refreshCurrentUser() {
			if (userStore.state.currentUser!.id === item.value?.id) {
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
						? addTokenToURL(getRootPath() + `assets/${response.data.data.avatar.id}?key=system-medium-cover`)
						: null;

					roleName.value = response.data.data?.role?.name;
				} catch (err) {
					unexpectedError(err);
				} finally {
					loading.value = false;
				}
			}
		}

		function discardAndLeave() {
			if (!leaveTo.value) return;
			edits.value = {};
			router.push(leaveTo.value);
		}

		async function toggleArchive() {
			await archive();

			if (isArchived.value === true) {
				router.push('/users');
			} else {
				confirmArchive.value = false;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

.action-delete {
	--v-button-background-color: var(--danger-10);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-25);
	--v-button-color-hover: var(--danger);
}

.action-archive {
	--v-button-background-color: var(--warning-10);
	--v-button-color: var(--warning);
	--v-button-background-color-hover: var(--warning-25);
	--v-button-color-hover: var(--warning);
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

		@include breakpoint(small) {
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

	@include breakpoint(small) {
		height: 188px;

		.user-box-content .location {
			display: block;
		}
	}
}
</style>

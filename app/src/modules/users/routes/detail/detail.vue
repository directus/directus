<template>
	<private-view :title="title">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon secondary exact :to="breadcrumb[0].to">
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
						v-tooltip.bottom="$t('delete')"
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
				v-tooltip.bottom="$t('save')"
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
			<users-navigation :current-role="(item && item.role) || (preset && preset.role)" />
		</template>

		<div class="user-detail">
			<div class="user-box" v-if="isNew === false">
				<div class="avatar">
					<v-skeleton-loader v-if="loading || previewLoading" />
					<img v-else-if="avatarSrc" :src="avatarSrc" :alt="item.first_name" />
					<v-icon v-else name="person" x-large />
				</div>
				<div class="user-box-content">
					<template v-if="loading">
						<v-skeleton-loader type="text" />
						<v-skeleton-loader type="text" />
						<v-skeleton-loader type="text" />
					</template>
					<template v-else-if="isNew === false">
						<div class="name type-title">{{ item.first_name }} {{ item.last_name }}</div>
						<div class="status-role" :class="item.status">{{ $t(item.status) }} {{ roleName }}</div>
						<div class="email">{{ item.email }}</div>
					</template>
				</div>
			</div>

			<v-form
				:fields="formFields"
				:loading="loading"
				:initial-values="item"
				:batch-mode="isBatch"
				:primary-key="primaryKey"
				v-model="edits"
			/>
		</div>

		<v-dialog v-model="confirmLeave">
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

		<template #drawer>
			<user-info-drawer-detail :is-new="isNew" :user="item" />
			<revisions-drawer-detail
				v-if="isBatch === false && isNew === false"
				collection="directus_users"
				:primary-key="primaryKey"
				ref="revisionsDrawerDetail"
			/>
			<comments-drawer-detail
				v-if="isBatch === false && isNew === false"
				collection="directus_users"
				:primary-key="primaryKey"
			/>
			<drawer-detail icon="help_outline" :title="$t('help_and_docs')">
				<div class="format-markdown" v-html="marked($t('page_help_users_detail'))" />
			</drawer-detail>
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs, ref, watch } from '@vue/composition-api';

import UsersNavigation from '../../components/navigation/';
import { i18n } from '@/lang';
import router from '@/router';
import RevisionsDrawerDetail from '@/views/private/components/revisions-drawer-detail';
import CommentsDrawerDetail from '@/views/private/components/comments-drawer-detail';
import useItem from '@/composables/use-item';
import SaveOptions from '@/views/private/components/save-options';
import marked from 'marked';
import api from '@/api';
import { useFieldsStore } from '@/stores/';
import useFormFields from '@/composables/use-form-fields';
import { Field } from '@/types';
import UserInfoDrawerDetail from './components/user-info-drawer-detail.vue';
import { getRootPath } from '@/utils/get-root-path';
import useShortcut from '@/composables/use-shortcut';

type Values = {
	[field: string]: any;
};

export default defineComponent({
	name: 'users-detail',
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
	components: { UsersNavigation, RevisionsDrawerDetail, SaveOptions, CommentsDrawerDetail, UserInfoDrawerDetail },
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
		const fieldsStore = useFieldsStore();

		const { primaryKey } = toRefs(props);
		const { breadcrumb } = useBreadcrumb();

		const revisionsDrawerDetail = ref<Vue | null>(null);

		const { isNew, edits, item, saving, loading, error, save, remove, deleting, saveAsCopy, isBatch } = useItem(
			ref('directus_users'),
			primaryKey
		);

		if (props.preset) {
			edits.value = {
				...props.preset,
				...edits.value,
			};
		}

		const hasEdits = computed<boolean>(() => Object.keys(edits.value).length > 0);

		const confirmDelete = ref(false);

		const title = computed(() => {
			if (loading.value === true) return i18n.t('loading');

			if (isNew.value === false && item.value !== null) {
				const user = item.value as any;
				return `${user.first_name} ${user.last_name}`;
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
			'last_login',
			'created_on',
			'created_by',
			'modified_by',
			'modified_on',
		];

		const fieldsFiltered = computed(() => {
			return fieldsStore
				.getFieldsForCollection('directus_users')
				.filter((field: Field) => fieldsBlacklist.includes(field.field) === false);
		});

		const { formFields } = useFormFields(fieldsFiltered);

		useShortcut('mod+s', saveAndStay);
		useShortcut('mod+shift+s', saveAndAddNew);

		return {
			title,
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
			revisionsDrawerDetail,
			marked,
			previewLoading,
			avatarSrc,
			roleName,
			confirmLeave,
			leaveTo,
			discardAndLeave,
			formFields,
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
			await save();
			router.push(`/users`);
		}

		async function saveAndStay() {
			const savedItem: Record<string, any> = await save();

			revisionsDrawerDetail.value?.$data?.refresh?.();

			if (props.primaryKey === '+') {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const newPrimaryKey = savedItem.id;
				router.replace(`/collections/users/${newPrimaryKey}`);
			}
		}

		async function saveAndAddNew() {
			await save();
			router.push(`/users/+`);
		}

		async function saveAsCopyAndNavigate() {
			const newPrimaryKey = await saveAsCopy();
			router.push(`/users/${newPrimaryKey}`);
		}

		async function deleteAndQuit() {
			await remove();
			router.push(`/users`);
		}

		function useUserPreview() {
			const loading = ref(false);
			const error = ref(null);
			const avatarSrc = ref<string | null>(null);
			const roleName = ref<string | null>(null);

			watch(() => props.primaryKey, getUserPreviewData, { immediate: true });

			return { loading, error, avatarSrc, roleName };

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
						? getRootPath() + `assets/${response.data.data.avatar.id}?key=system-medium-cover`
						: null;
					roleName.value = response.data.data.role.name;
				} catch (err) {
					error.value = err;
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

.header-icon.secondary {
	--v-button-background-color: var(--background-normal);
}

.user-detail {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}

.user-box {
	--v-skeleton-loader-background-color: var(--background-normal);

	display: flex;
	align-items: center;
	max-width: calc(var(--form-column-max-width) * 2 + var(--form-horizontal-gap));
	height: 172px;
	margin-bottom: var(--form-vertical-gap);
	padding: 12px;
	background-color: var(--background-subdued);
	border: 2px solid var(--border-normal);
	border-radius: var(--border-radius);

	.avatar {
		--v-icon-color: var(--foreground-subdued);

		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 144px;
		height: 144px;
		margin-right: 22px;
		overflow: hidden;
		background-color: var(--background-normal);
		border-radius: var(--border-radius);

		.v-skeleton-loader {
			width: 100%;
			height: 100%;
		}

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.user-box-content {
		flex-grow: 1;

		.v-skeleton-loader {
			width: 175px;
		}

		.v-skeleton-loader:not(:last-child) {
			margin-bottom: 16px;
		}

		.status-role {
			color: var(--foreground-subdued);
			&.active {
				color: var(--success);
			}
		}
		.email {
			color: var(--foreground-subdued);
		}
	}
}
</style>

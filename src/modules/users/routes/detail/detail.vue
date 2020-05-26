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
			<users-navigation />
		</template>

		<div class="user-detail">
			<div class="user-box">
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
					<template v-else>
						<div class="name type-title">
							{{ item.first_name }} {{ item.last_name }}
						</div>
						<div class="status-role" :class="item.status">
							{{ $t(item.status) }} {{ roleName }}
						</div>
						<div class="email">{{ item.email }}</div>
					</template>
				</div>
			</div>

			<v-form
				:loading="loading"
				:initial-values="item"
				collection="directus_users"
				:batch-mode="isBatch"
				:primary-key="primaryKey"
				v-model="edits"
			/>
		</div>

		<template #drawer>
			<drawer-detail icon="info_outline" :title="$t('information')" close>
				[TK]
			</drawer-detail>
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
				<div
					class="format-markdown"
					v-html="marked($t('page_help_collections_overview'))"
				/>
			</drawer-detail>
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs, ref, watch } from '@vue/composition-api';
import useProjectsStore from '@/stores/projects';
import UsersNavigation from '../../components/navigation/';
import { i18n } from '@/lang';
import router from '@/router';
import RevisionsDrawerDetail from '@/views/private/components/revisions-drawer-detail';
import CommentsDrawerDetail from '@/views/private/components/comments-drawer-detail';
import useItem from '@/composables/use-item';
import SaveOptions from '@/views/private/components/save-options';
import marked from 'marked';
import api from '@/api';

type Values = {
	[field: string]: any;
};

export default defineComponent({
	name: 'users-detail',
	components: { UsersNavigation, RevisionsDrawerDetail, SaveOptions, CommentsDrawerDetail },
	props: {
		primaryKey: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const projectsStore = useProjectsStore();
		const { currentProjectKey } = toRefs(projectsStore.state);
		const { primaryKey } = toRefs(props);
		const { breadcrumb } = useBreadcrumb();

		const revisionsDrawerDetail = ref<Vue>(null);

		const {
			isNew,
			edits,
			item,
			saving,
			loading,
			error,
			save,
			remove,
			deleting,
			saveAsCopy,
			isBatch,
		} = useItem(ref('directus_users'), primaryKey);

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
		};

		function useBreadcrumb() {
			const breadcrumb = computed(() => [
				{
					name: i18n.t('user_directory'),
					to: `/${currentProjectKey.value}/users/`,
				},
			]);

			return { breadcrumb };
		}

		async function saveAndQuit() {
			await save();
			router.push(`/${currentProjectKey.value}/users`);
		}

		async function saveAndStay() {
			const savedItem: Record<string, any> = await save();

			revisionsDrawerDetail.value?.$data?.refresh?.();

			if (props.primaryKey === '+') {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const newPrimaryKey = savedItem.id;
				router.replace(`/${currentProjectKey.value}/collections/users/${newPrimaryKey}`);
			}
		}

		async function saveAndAddNew() {
			await save();
			router.push(`/${currentProjectKey.value}/users/+`);
		}

		async function saveAsCopyAndNavigate() {
			const newPrimaryKey = await saveAsCopy();
			router.push(`/${currentProjectKey.value}/users/${newPrimaryKey}`);
		}

		async function deleteAndQuit() {
			await remove();
			router.push(`/${currentProjectKey.value}/users`);
		}

		function useUserPreview() {
			const loading = ref(false);
			const error = ref(null);
			const avatarSrc = ref<string>(null);
			const roleName = ref<string>(null);

			watch(() => props.primaryKey, getUserPreviewData);

			return { loading, error, avatarSrc, roleName };

			async function getUserPreviewData() {
				if (props.primaryKey === '+') return;

				loading.value = true;

				try {
					const response = await api.get(
						`/${currentProjectKey.value}/users/${props.primaryKey}`,
						{
							params: {
								fields: ['role.name', 'avatar.data'],
							},
						}
					);

					avatarSrc.value = response.data.data.avatar?.data?.thumbnails?.find(
						(thumb: any) => thumb.key === 'directus-medium-crop'
					)?.url;
					roleName.value = response.data.data.role.name;
				} catch (err) {
					error.value = err;
				} finally {
					loading.value = false;
				}
			}
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

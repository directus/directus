<template>
	<drawer-detail :title="$t('comments')" icon="mode_comment">
		<form @submit.prevent="postComment">
			<v-textarea
				:placeholder="$t('leave_comment')"
				v-model="newCommentContent"
				expand-on-focus
			>
				<template #append>
					<v-button
						:disabled="!newCommentContent || newCommentContent.length === 0"
						:loading="saving"
						class="post-comment"
						@click="postComment"
						x-small
					>
						{{ $t('submit') }}
					</v-button>
				</template>
			</v-textarea>
		</form>
		<transition-group name="slide" tag="div">
			<div class="activity-record" v-for="act in activity" :key="act.id">
				<div class="activity-header">
					<v-avatar small>
						<v-icon name="person_outline" />
					</v-avatar>
					<div class="name">
						<template v-if="act.action_by && act.action_by">
							{{ act.action_by.first_name }} {{ act.action_by.last_name }}
						</template>
						<template v-else-if="act.action.by && action.action_by">
							{{ $t('private_user') }}
						</template>
						<template v-else>
							{{ $t('external') }}
						</template>
					</div>
					<div class="date" v-tooltip.start="new Date(act.action_on)">
						{{ act.date_relative }}
					</div>
				</div>

				<div class="content">
					<template v-if="act.comment">
						<span v-html="marked(act.comment)" />
					</template>
					<template v-else-if="act.action === 'create'">
						{{ $t('activity_delta_created') }}
					</template>
					<template v-else-if="act.action === 'update'">
						{{ $t('activity_delta_updated') }}
					</template>
					<template v-else-if="act.action === 'delete'">
						{{ $t('activity_delta_deleted') }}
					</template>
				</div>
			</div>
		</transition-group>

		<div class="activity-record">
			<div class="content">{{ $t('activity_delta_created_externally') }}</div>
		</div>
	</drawer-detail>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import useProjectsStore from '@/stores/projects';
import api from '@/api';
import localizedFormatDistance from '@/utils/localized-format-distance';
import marked from 'marked';
import { Avatar } from '@/stores/user/types';
import notify from '@/utils/notify';
import i18n from '@/lang';

type Activity = {
	action: 'create' | 'update' | 'delete' | 'comment';
	action_by: null | {
		id: number;
		first_name: string;
		last_name: string;
		avatar: null | Avatar;
	};
	action_on: string;
	edited_on: null | string;
	comment: null | string;
};

export default defineComponent({
	props: {
		collection: {
			type: String,
			required: true,
		},
		primaryKey: {
			type: [String, Number],
			required: true,
		},
	},
	setup(props) {
		const projectsStore = useProjectsStore();

		const { activity, loading, error, refresh } = useActivity(
			props.collection,
			props.primaryKey
		);
		const { newCommentContent, postComment, saving } = useComment();

		return { activity, loading, error, marked, newCommentContent, postComment, saving };

		function useActivity(collection: string, primaryKey: string | number) {
			const activity = ref<Activity[]>(null);
			const error = ref(null);
			const loading = ref(false);

			getActivity();

			return { activity, error, loading, refresh };

			async function getActivity() {
				error.value = null;
				loading.value = true;

				try {
					const response = await api.get(
						`/${projectsStore.state.currentProjectKey}/activity`,
						{
							params: {
								'filter[collection][eq]': collection,
								'filter[item][eq]': primaryKey,
								'filter[action][in]': 'comment,create,update,delete',
								sort: '-id', // directus_activity has auto increment and is therefore in chronological order
								fields: [
									'id',
									'action',
									'action_on',
									'action_by.id',
									'action_by.first_name',
									'action_by.last_name',
									'action_by.avatar.data',
									'comment',
								],
							},
						}
					);

					const records = [];

					for (const record of response.data.data) {
						records.push({
							...record,
							date_relative: await localizedFormatDistance(
								new Date(record.action_on),
								new Date()
							),
						});
					}

					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					activity.value = records;
				} catch (error) {
					error.value = error;
				} finally {
					loading.value = false;
				}
			}

			async function refresh() {
				await getActivity();
			}
		}

		function useComment() {
			const newCommentContent = ref(null);
			const saving = ref(false);

			return { newCommentContent, postComment, saving };

			async function postComment() {
				saving.value = true;

				try {
					await api.post(`/${projectsStore.state.currentProjectKey}/activity/comment`, {
						collection: props.collection,
						item: props.primaryKey,
						comment: newCommentContent.value,
					});

					await refresh();

					newCommentContent.value = null;

					notify({
						title: i18n.t('post_comment_success'),
						type: 'success',
					});
				} catch {
					notify({
						title: i18n.t('post_comment_failed'),
						type: 'error',
					});
				} finally {
					saving.value = false;
				}
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.post-comment {
	position: absolute;
	right: 8px;
	bottom: 8px;
}

.activity-record {
	margin-top: 12px;
	padding-top: 8px;
	border-top: 2px solid var(--border-normal);
}

.activity-header {
	display: flex;
	align-items: center;
	margin-bottom: 8px;

	.v-avatar {
		--v-avatar-color: var(--background-normal-alt);

		margin-right: 8px;

		.v-icon {
			--v-icon-color: var(--foreground-subdued);
		}
	}

	.name {
		margin-right: 8px;
	}

	.date {
		color: var(--foreground-subdued);
	}
}

.content {
	font-style: italic;
}

.slide-enter-active,
.slide-leave-active {
	transition: all var(--slow) var(--transition);
}

.slide-leave-active {
	position: absolute;
}

.slide-move {
	transition: all 500ms var(--transition);
}

.slide-enter,
.slide-leave-to {
	opacity: 0;
}
</style>

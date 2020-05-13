<template>
	<drawer-detail :title="$t('revisions')" icon="change_history">
		<!-- "Today", "Yesterday", and then: "Sep 6", "Sep 6, 2019" (previous years) -->
		<div class="day-break"><span>Today</span></div>

		<transition-group name="slide" tag="div">
			<div v-for="act in activity" :key="act.id" class="revision internal">
				<div class="header">
					<template v-if="act.action === 'create'">
						<span class="dot create"></span>
						{{ $t('revision_delta_created') }}
					</template>
					<template v-else-if="act.action === 'update'">
						<span class="dot update"></span>
						{{ $t('revision_delta_updated', { count: 3 }) }}
					</template>
					<template v-else-if="act.action === 'soft-delete'">
						<span class="dot delete"></span>
						{{ $t('revision_delta_soft_deleted') }}
					</template>
					<template v-else-if="act.action === 'delete'">
						<span class="dot delete"></span>
						{{ $t('revision_delta_deleted') }}
					</template>

					<v-icon name="expand_more" class="more" />
				</div>

				<div class="content">
					<span class="time">{{ getFormattedTime(act.action_on) }}</span>
					—
					<span class="name">
						<template v-if="act.action_by && act.action_by">
							{{ act.action_by.first_name }} {{ act.action_by.last_name }}
						</template>
						<template v-else-if="act.action_by && action.action_by">
							{{ $t('private_user') }}
						</template>
					</span>

					<div v-if="act.comment" class="comment" v-html="marked(act.comment)" />
				</div>
			</div>
		</transition-group>

		<!-- Only show this if "created" revision doesn't exist for this item -->
		<div class="revision external">
			<div class="header">
				<span class="dot"></span>
				{{ $t('revision_delta_created_externally') }}
			</div>
			<div class="content">{{ $t('revision_unknown') }}</div>
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
import format from 'date-fns/format';
import i18n from '@/lang';

type Activity = {
	action: 'create' | 'update' | 'soft-delete' | 'delete';
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

		return {
			activity,
			loading,
			error,
			marked,
			newCommentContent,
			postComment,
			saving,
			getFormattedTime,
		};

		function getFormattedTime(datetime: string) {
			return format(new Date(datetime), String(i18n.t('date-fns_time')));
		}

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
								'filter[action][in]': 'create,update,soft-delete,delete',
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
								new Date(),
								{
									addSuffix: true,
								}
							),
						});
					}

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
.day-break {
	position: sticky;
	top: 0;
	z-index: 2;
	margin-top: 8px;
	margin-bottom: 8px;
	padding-top: 8px;
	padding-bottom: 8px;
	background-color: var(--background-normal);
	box-shadow: 0 0 4px 2px var(--background-normal);

	&:first-of-type {
		margin-top: 0;
	}

	span {
		z-index: 2;
		padding-right: 8px;
		color: var(--foreground-subdued);
		background-color: var(--background-normal);
	}

	&::before {
		position: absolute;
		top: 18px;
		right: 0;
		left: 0;
		z-index: -1;
		height: 2px;
		background-color: var(--border-normal);
		content: '';
	}
}

.revision {
	position: relative;
	margin-bottom: 16px;
	margin-left: 20px;

	&.internal {
		cursor: pointer;

		&::after {
			position: absolute;
			top: 12px;
			left: -17px;
			z-index: 1;
			width: 2px;
			height: calc(100% + 12px);
			background-color: var(--background-normal-alt);
			content: '';
		}
	}

	&.external {
		cursor: auto;
	}

	.header {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-weight: 600;

		.dot {
			position: absolute;
			top: 6px;
			left: -22px;
			width: 12px;
			height: 12px;
			background-color: var(--warning);
			border: 2px solid var(--background-normal);
			border-radius: 8px;

			&.create {
				background-color: var(--success);
			}

			&.update {
				background-color: var(--primary);
			}

			&.delete {
				background-color: var(--danger);
			}
		}

		.more {
			flex-basis: 24px;
			color: var(--foreground-subdued);
			transition: color var(--fast) var(--transition);
		}
	}

	.content {
		color: var(--foreground-subdued);
		line-height: 16px;

		.time {
			text-transform: lowercase;
		}

		.comment {
			position: relative;
			margin-top: 8px;
			padding: 8px;
			background-color: var(--background-page);
			border-radius: var(--border-radius);

			&::before {
				position: absolute;
				top: -4px;
				left: 20px;
				width: 10px;
				height: 10px;
				background-color: var(--background-page);
				border-radius: 2px;
				transform: translateX(-50%) rotate(45deg);
				content: '';
			}
		}
	}

	&:hover {
		.header {
			.more {
				color: var(--foreground-normal);
			}
		}
	}
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

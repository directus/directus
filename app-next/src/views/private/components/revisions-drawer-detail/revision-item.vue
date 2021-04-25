<template>
	<div class="revision-item" @click="$emit('click')" :class="{ last }">
		<div class="header">
			<span class="dot" :class="revision.activity.action" />
			{{ headerMessage }}
		</div>
		<div class="content">
			<span class="time">{{ time }}</span>
			–
			<user-popover v-if="revision.activity.user" class="user" :user="revision.activity.user.id">
				{{ user }}
			</user-popover>

			<span v-else>{{ $t('private_user') }}</span>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Revision } from './types';
import i18n from '@/lang';
import { format } from 'date-fns';
import { userName } from '@/utils/user-name';

export default defineComponent({
	props: {
		revision: {
			type: Object as PropType<Revision>,
			required: true,
		},
		last: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const revisionCount = computed(() => {
			return Object.keys(props.revision.delta).length;
		});

		const headerMessage = computed(() => {
			switch (props.revision.activity.action.toLowerCase()) {
				case 'create':
					return i18n.t('revision_delta_created');
				case 'update':
					return i18n.tc('revision_delta_updated', revisionCount.value);
				case 'delete':
					return i18n.t('revision_delta_deleted');
				case 'revert':
					return i18n.t('revision_delta_reverted');
				default:
					return i18n.t('revision_delta_other');
			}
		});

		const time = computed(() => {
			return format(new Date(props.revision.activity.timestamp), String(i18n.t('date-fns_time')));
		});

		const user = computed(() => {
			if (props.revision?.activity?.user && typeof props.revision.activity.user === 'object') {
				return userName(props.revision.activity.user);
			}

			return i18n.t('private_user');
		});

		return { headerMessage, time, user };
	},
});
</script>

<style lang="scss" scoped>
.revision-item {
	position: relative;
	margin-bottom: 16px;
	margin-left: 16px;

	.header {
		position: relative;
		z-index: 2;
		font-weight: 600;

		.dot {
			position: absolute;
			top: 6px;
			left: -18px;
			z-index: 2;
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
	}

	&:not(.last)::after {
		position: absolute;
		top: 12px;
		left: -13px;
		z-index: 1;
		width: 2px;
		height: calc(100% + 12px);
		background-color: var(--background-normal-alt);
		content: '';
	}

	&::before {
		position: absolute;
		top: -4px;
		left: -24px;
		z-index: 1;
		width: calc(100% + 28px);
		height: calc(100% + 10px);
		background-color: var(--background-normal-alt);
		border-radius: var(--border-radius);
		opacity: 0;
		transition: opacity var(--fast) var(--transition);
		content: '';
		pointer-events: none;
	}

	&:hover {
		cursor: pointer;
		.header {
			.dot {
				border-color: var(--background-normal-alt);
			}
		}

		&::before {
			opacity: 1;
		}
	}
}

.content {
	position: relative;
	z-index: 2;
	color: var(--foreground-subdued);
	line-height: 16px;

	.time {
		text-transform: lowercase;
		font-feature-settings: 'tnum';
	}

	.user {
		&:hover {
			color: var(--foreground-normal);
		}
	}
}
</style>

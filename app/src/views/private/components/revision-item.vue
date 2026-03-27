<script setup lang="ts">
import { format } from 'date-fns';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import UserPopover from './user-popover.vue';
import { useFieldsStore } from '@/stores/fields';
import { Revision } from '@/types/revisions';
import { getRevisionFields } from '@/utils/get-revision-fields';
import { userName } from '@/utils/user-name';

const props = defineProps<{
	revision: Revision;
	last?: boolean;
}>();

defineEmits<{
	(e: 'click'): void;
}>();

const { t } = useI18n();

const fieldsStore = useFieldsStore();
const fields = fieldsStore.getFieldsForCollection(props.revision.collection);

const revisionCount = computed(() => {
	const revisionDelta = Object.keys(props.revision.delta ?? {});
	const revisionFields = getRevisionFields(revisionDelta, fields);
	return revisionFields.length;
});

const headerMessage = computed(() => {
	switch (props.revision.activity.action.toLowerCase()) {
		case 'create':
			return t('revision_delta_created');
		case 'update':
			return t('revision_delta_updated', revisionCount.value);
		case 'delete':
			return t('revision_delta_deleted');
		case 'version_save':
			return t('revision_delta_updated', revisionCount.value);
		case 'revert':
			return t('revision_delta_reverted');
		default:
			return t('revision_delta_other');
	}
});

const time = computed(() => {
	return format(new Date(props.revision.activity.timestamp), String(t('date-fns_time')));
});

const user = computed(() => {
	if (props.revision?.activity?.user && typeof props.revision.activity.user === 'object') {
		return userName(props.revision.activity.user);
	}

	return t('private_user');
});
</script>

<template>
	<button type="button" class="revision-item" :class="{ last }" @click="$emit('click')">
		<div class="header">
			<span class="dot" :class="revision.activity.action" />
			{{ headerMessage }}
		</div>
		<div class="content">
			<span class="time">{{ time }}</span>
			–
			<UserPopover
				v-if="revision.activity.user"
				class="user"
				:user="typeof revision.activity.user === 'string' ? revision.activity.user : revision.activity.user.id"
			>
				<span>{{ user }}</span>
			</UserPopover>

			<span v-else>{{ $t('private_user') }}</span>
		</div>
	</button>
</template>

<style lang="scss" scoped>
.revision-item {
	--padding-left: 1.5rem;

	position: relative;
	display: block;
	inline-size: 100%;
	margin-block-end: 0.6875rem;
	padding-inline-start: var(--padding-left);
	text-align: start;

	.header {
		position: relative;
		z-index: 2;
		font-weight: 600;

		.dot {
			position: absolute;
			inset-block-start: 0.3125rem;
			inset-inline-start: calc(-1 * var(--padding-left) + var(--icon-size-default) / 2);
			transform: translate(-50%, 0);
			z-index: 2;
			inline-size: 0.625rem;
			block-size: 0.625rem;
			background-color: var(--theme--warning);
			border: var(--theme--border-width) solid var(--theme--background-normal);
			border-radius: 0.4375rem;

			&.create {
				background-color: var(--theme--primary);
			}

			&.update {
				background-color: var(--theme--primary);
			}

			&.version_save {
				background-color: var(--theme--primary);
			}

			&.delete {
				background-color: var(--theme--danger);
			}
		}
	}

	&::before {
		position: absolute;
		inset-block-start: -0.25rem;
		inset-inline: calc(var(--icon-size-default) - 0.125rem) 0;
		z-index: 1;
		block-size: calc(100% + 0.5625rem);
		background-color: var(--theme--background-subdued);
		border-radius: var(--theme--border-radius);
		opacity: 0;
		transition: opacity var(--fast) var(--transition);
		content: '';
		pointer-events: none;
	}

	&:not(.last)::after {
		position: absolute;
		inset-block-start: 0.6875rem;
		inset-inline-start: calc(var(--icon-size-default) / 2);
		transform: translate(-50%, 0);
		z-index: 1;
		inline-size: 1px; /* stylelint-disable-line unit-disallowed-list -- hairline */
		block-size: calc(100% + 0.6875rem);
		background-color: var(--theme--background-accent);
		content: '';
	}

	&:hover {
		cursor: pointer;

		.header {
			.dot {
				border-color: var(--theme--background-accent);
			}
		}

		&::before {
			opacity: 1;
			transition: none;
		}
	}

	& + & {
		margin-block-start: 0.6875rem;
	}
}

.content {
	position: relative;
	z-index: 2;
	color: var(--theme--foreground-subdued);
	line-height: 0.875rem;

	.time {
		text-transform: lowercase;
		font-feature-settings: 'tnum';
	}

	.user {
		span {
			margin: -0.3125rem;
			padding: 0.3125rem;
		}

		&:hover {
			color: var(--theme--foreground);
		}
	}
}
</style>

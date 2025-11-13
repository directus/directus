<script setup lang="ts">
import { useFieldsStore } from '@/stores/fields';
import { Revision } from '@/types/revisions';
import { getRevisionFields } from '@/utils/get-revision-fields';
import { userName } from '@/utils/user-name';
import { format } from 'date-fns';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

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
			return t('revision_delta_updated', revisionCount.value);
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
			<user-popover
				v-if="revision.activity.user"
				class="user"
				:user="typeof revision.activity.user === 'string' ? revision.activity.user : revision.activity.user.id"
			>
				<span>{{ user }}</span>
			</user-popover>

			<span v-else>{{ $t('private_user') }}</span>
		</div>
	</button>
</template>

<style lang="scss" scoped>
.revision-item {
	position: relative;
	display: block;
	inline-size: calc(100% - 16px);
	margin-block-end: 12px;
	margin-inline-start: 16px;
	text-align: start;

	.header {
		position: relative;
		z-index: 2;
		font-weight: 600;

		.dot {
			position: absolute;
			inset-block-start: 6px;
			inset-inline-start: -18px;
			z-index: 2;
			inline-size: 12px;
			block-size: 12px;
			background-color: var(--theme--warning);
			border: var(--theme--border-width) solid var(--theme--background-normal);
			border-radius: 8px;

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

	&:not(.last)::after {
		position: absolute;
		inset-block-start: 12px;
		inset-inline-start: -13px;
		z-index: 1;
		inline-size: 2px;
		block-size: calc(100% + 12px);
		background-color: var(--theme--background-accent);
		content: '';
	}

	&::before {
		position: absolute;
		inset-block-start: -4px;
		inset-inline-start: -24px;
		z-index: 1;
		inline-size: calc(100% + 32px);
		block-size: calc(100% + 10px);
		background-color: var(--theme--background-accent);
		border-radius: var(--theme--border-radius);
		opacity: 0;
		transition: opacity var(--fast) var(--transition);
		content: '';
		pointer-events: none;
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
		}
	}

	& + & {
		margin-block-start: 12px;
	}
}

.content {
	position: relative;
	z-index: 2;
	color: var(--theme--foreground-subdued);
	line-height: 16px;

	.time {
		text-transform: lowercase;
		font-feature-settings: 'tnum';
	}

	.user {
		span {
			margin: -6px;
			padding: 6px;
		}

		&:hover {
			color: var(--theme--foreground);
		}
	}
}
</style>

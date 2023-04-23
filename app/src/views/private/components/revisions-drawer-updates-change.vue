<template>
	<div class="change-line" :class="{ added, deleted, updated, 'no-highlight': wholeThing }">
		<v-icon :name="added ? 'add' : deleted ? 'remove' : 'warning'" />
		<div class="delta">
			<span v-for="(part, index) in changesFiltered" :key="index" :class="{ changed: part.added || part.removed }">
				<template v-if="part.updated">{{ t('revision_delta_update_message') }}</template>
				<template v-else-if="part.value">{{ part.value }}</template>
				<template v-else>
					<span class="no-value">{{ t('no_value') }}</span>
				</template>
			</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { ArrayChange } from 'diff';

export type Change = {
	added?: boolean;
	removed?: boolean;
	updated?: boolean;
	count?: number;
	value: string;
};

const props = defineProps<{
	changes: Change[] | ArrayChange<any>[];
	added?: boolean;
	deleted?: boolean;
	updated?: boolean;
}>();

const { t } = useI18n();

const changesFiltered = computed(() => {
	return (props.changes as Change[]).filter((change: any) => {
		if (props.updated) return true;

		if (props.added === true) {
			return change.removed !== true;
		}

		return change.added !== true;
	});
});

// The whole value changed instead of parts, this should disable the highlighting
const wholeThing = computed(() => {
	return props.changes.length === 2; // before/after
});
</script>

<style lang="scss" scoped>
.change-line {
	position: relative;
	width: 100%;
	padding: 8px 12px 8px 40px;
	border-radius: var(--border-radius);

	.v-icon {
		position: absolute;
		top: 8px;
		left: 8px;
	}

	&.added {
		color: var(--success);
		background-color: var(--success-alt);
		border-radius: 0 0 var(--border-radius) var(--border-radius);

		.changed {
			background-color: var(--success-25);
		}
	}

	&.deleted {
		color: var(--danger);
		background-color: var(--danger-alt);
		border-radius: var(--border-radius) var(--border-radius) 0 0;

		.changed {
			background-color: var(--danger-25);
		}
	}

	&.updated {
		color: var(--warning);
		background-color: var(--warning-alt);
		border-radius: var(--border-radius);
	}
}

.changed {
	position: relative;
	margin-right: 0.2em;
	padding: 2px;
	border-radius: var(--border-radius);
}

.no-value {
	font-style: italic;
	opacity: 0.25;
}

.no-highlight .changed {
	background-color: transparent;
}
</style>

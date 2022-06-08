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

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, computed } from 'vue';
import { ArrayChange } from 'diff';

export type Change = {
	added?: boolean;
	removed?: boolean;
	updated?: boolean;
	count?: number;
	value: string;
};

export default defineComponent({
	props: {
		changes: {
			type: Array as PropType<Change[] | ArrayChange<any>[]>,
			required: true,
		},
		added: {
			type: Boolean,
			default: false,
		},
		deleted: {
			type: Boolean,
			default: false,
		},
		updated: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
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

		return { t, changesFiltered, wholeThing };
	},
});
</script>

<style lang="scss" scoped>
.change-line {
	position: relative;
	width: 100%;
	padding: 8px 12px 8px 40px;
	border-radius: var(--g-border-radius);

	.v-icon {
		position: absolute;
		top: 8px;
		left: 8px;
	}

	&.added {
	  color: var(--g-color-success-normal);
	  background-color: var(--g-color-success-subtle);
	  border-radius: 0 0 var(--g-border-radius) var(--g-border-radius) !important;

	  .changed {
	  	background-color: var(--g-color-success-subtle);
	  }
  }

  &.deleted {
  	color: var(--g-color-danger-normal);
  	background-color: var(--g-color-danger-subtle);
  	border-radius: var(--g-border-radius) var(--g-border-radius) 0 0 !important;

  	.changed {
		  background-color: var(--g-color-danger-subtle);
	  }
  }

	&.updated {
		color: var(--g-color-warning-normal);
		background-color: var(--g-color-danger-subtle);
		border-radius: var(--g-border-radius);
	}
}

.changed {
	position: relative;
	margin-right: 0.2em;
	padding: 2px;
	border-radius: var(--g-border-radius);
}

.no-value {
	font-style: italic;
	opacity: 0.25;
}

.no-highlight .changed {
	background-color: transparent;
}
</style>

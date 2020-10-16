<template>
	<div class="change-line" :class="{ added, deleted, 'no-highlight': wholeThing }">
		<v-icon :name="added ? 'add' : 'remove'" />
		<div class="delta">
			<span
				v-for="(part, index) in changesFiltered"
				:key="index"
				:class="{ changed: part.added || part.removed }"
			>
				{{ part.value }}
			</span>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';

type Change = {
	added?: boolean;
	removed?: boolean;
	count: number;
	value: string;
};

export default defineComponent({
	props: {
		changes: {
			type: Array as PropType<Change[]>,
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
	},
	setup(props) {
		const changesFiltered = computed(() => {
			return props.changes.filter((change) => {
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

		return { changesFiltered, wholeThing };
	},
});
</script>

<style lang="scss" scoped>
.change-line {
	position: relative;
	width: 100%;
	padding: 8px 12px 8px 52px;
	border-radius: var(--border-radius);

	.v-icon {
		position: absolute;
		top: 6px;
		left: 12px;
	}
}

.changed {
	position: relative;
	margin-right: 0.2em;
	padding: 2px;
	border-radius: var(--border-radius);
}

.added {
	color: var(--success);
	background-color: var(--success-alt);

	.changed {
		background-color: var(--success-25);
	}
}

.deleted {
	color: var(--danger);
	background-color: var(--danger-alt);

	.changed {
		background-color: var(--danger-25);
	}
}

.no-highlight .changed {
	background-color: transparent;
}
</style>

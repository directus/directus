<template>
	<div class="change-line" :class="{ added, deleted, 'no-highlight': wholeThing }">
		<v-icon :name="added ? 'add' : 'remove'" />
		<div class="delta">
			<span v-for="(part, index) in changesFiltered" :key="index" :class="{ changed: part.added || part.removed }">
				<template v-if="part.value">{{ part.value }}</template>
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
		const { t } = useI18n();
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

		return { t, changesFiltered, wholeThing };
	},
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
	border-radius: 0 0 var(--border-radius) var(--border-radius) !important;

	.changed {
		background-color: var(--success-25);
	}
}

.deleted {
	color: var(--danger);
	background-color: var(--danger-alt);
	border-radius: var(--border-radius) var(--border-radius) 0 0 !important;

	.changed {
		background-color: var(--danger-25);
	}
}

.no-value {
	font-style: italic;
	opacity: 0.25;
}

.no-highlight .changed {
	background-color: transparent;
}
</style>

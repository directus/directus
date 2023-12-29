<script setup lang="ts">
import { useRevisions } from '@/composables/use-revisions';
import { useExtensions } from '@/extensions';
import type { FlowRaw } from '@directus/types';
import { Action } from '@directus/constants';
import { computed, ref, toRefs, unref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { getTriggers } from '../triggers';
import { abbreviateNumber } from '@directus/utils';

const props = defineProps<{
	flow: FlowRaw;
}>();

const { flow } = toRefs(props);

const { t } = useI18n();

const { triggers } = getTriggers();
const { operations } = useExtensions();

const usedTrigger = computed(() => {
	return triggers.find((trigger) => trigger.id === unref(flow).trigger);
});

const page = ref<number>(1);

const { revisionsByDate, getRevisions, revisionsCount, getRevisionsCount, loading, loadingCount, pagesCount, refresh } =
	useRevisions(
		ref('directus_flows'),
		computed(() => unref(flow).id),
		ref(null),
		{
			action: Action.RUN,
		},
	);

watch(
	() => page.value,
	(newPage) => {
		refresh(newPage);
	},
);

onMounted(() => {
	getRevisionsCount();
});

const previewing = ref();

const triggerData = computed(() => {
	if (!unref(previewing)?.data) return { trigger: null, accountability: null, options: null };

	const { data } = unref(previewing).data;

	return {
		trigger: data.$trigger,
		accountability: data.$accountability,
		options: props.flow.options,
	};
});

const steps = computed(() => {
	if (!unref(previewing)?.data?.steps) return [];
	const { steps } = unref(previewing).data;

	return steps.map(
		({
			operation,
			status,
			key,
			options,
		}: {
			operation: string;
			status: 'reject' | 'resolve' | 'unknown';
			key: string;
			options: Record<string, any>;
		}) => {
			const operationConfiguration = props.flow.operations.find((operationConfig) => operationConfig.id === operation);

			const operationType = operations.value.find((operation) => operation.id === operationConfiguration?.type);

			return {
				id: operation,
				name: operationConfiguration?.name ?? key,
				data: unref(previewing).data?.data?.[key] ?? null,
				options: options ?? null,
				operationType: operationType?.name ?? operationConfiguration?.type ?? '--',
				key,
				status,
			};
		},
	);
});

function onToggle(open: boolean) {
	if (open && revisionsByDate.value === null) getRevisions();
}
</script>

<template>
	<sidebar-detail
		:title="t('logs')"
		icon="fact_check"
		:badge="!loadingCount && revisionsCount > 0 ? abbreviateNumber(revisionsCount) : null"
		@toggle="onToggle"
	>
		<v-progress-linear v-if="!revisionsByDate && loading" indeterminate />

		<div v-else-if="revisionsCount === 0" class="empty">{{ t('no_logs') }}</div>

		<v-detail
			v-for="group in revisionsByDate"
			v-else
			:key="group.dateFormatted"
			:label="group.dateFormatted"
			class="revisions-date-group"
			start-open
		>
			<div class="scroll-container">
				<div v-for="revision in group.revisions" :key="revision.id" class="log">
					<button @click="previewing = revision">
						<v-icon name="play_arrow" color="var(--theme--primary)" small />
						{{ revision.timeRelative }}
					</button>
				</div>
			</div>
		</v-detail>

		<v-pagination v-if="pagesCount > 1" v-model="page" :length="pagesCount" :total-visible="3" />
	</sidebar-detail>

	<v-drawer
		:model-value="!!previewing"
		:title="previewing ? previewing.timestampFormatted : t('logs')"
		icon="fact_check"
		@cancel="previewing = null"
		@esc="previewing = null"
	>
		<div class="content">
			<div class="steps">
				<div class="step">
					<div class="header">
						<span class="dot" />
						<span class="type-label">
							{{ t('trigger') }}
							<span class="subdued">&nbsp;{{ usedTrigger?.name }}</span>
						</span>
					</div>

					<div class="inset">
						<v-detail v-if="triggerData.options" :label="t('options')">
							<pre class="json selectable">{{ triggerData.options }}</pre>
						</v-detail>

						<v-detail v-if="triggerData.trigger" :label="t('payload')">
							<pre class="json selectable">{{ triggerData.trigger }}</pre>
						</v-detail>

						<v-detail v-if="triggerData.accountability" :label="t('accountability')">
							<pre class="json selectable">{{ triggerData.accountability }}</pre>
						</v-detail>
					</div>
				</div>

				<div v-for="step of steps" :key="step.id" class="step">
					<div class="header">
						<span class="dot" :class="step.status" />
						<span v-tooltip="step.key" class="type-label">
							{{ step.name }}
							<span class="subdued">&nbsp;{{ step.operationType }}</span>
						</span>
					</div>

					<div class="inset">
						<v-detail v-if="step.options" :label="t('options')">
							<pre class="json selectable">{{ step.options }}</pre>
						</v-detail>

						<v-detail v-if="step.data" :label="t('payload')">
							<pre class="json selectable">{{ step.data }}</pre>
						</v-detail>
					</div>
				</div>
			</div>
		</div>
	</v-drawer>
</template>

<style lang="scss" scoped>
.v-progress-linear {
	margin: 24px 0;
}

.content {
	padding: var(--content-padding);
}

.log {
	position: relative;
	display: block;

	button {
		position: relative;
		z-index: 2;
		display: block;
		width: 100%;
		text-align: left;
	}

	&::before {
		position: absolute;
		top: -4px;
		left: -4px;
		z-index: 1;
		width: calc(100% + 8px);
		height: calc(100% + 8px);
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
		margin-top: 8px;
	}
}

.json {
	background-color: var(--theme--background-subdued);
	font-family: var(--theme--fonts--monospace--font-family);
	border-radius: var(--theme--border-radius);
	padding: 20px;
	margin-top: 20px;
	white-space: pre-wrap;
	overflow-wrap: break-word;
}

.steps {
	position: relative;

	.step {
		position: relative;

		&::after {
			content: '';
			position: absolute;
			width: var(--theme--border-width);
			left: -11px;
			top: 0;
			background-color: var(--theme--border-color-subdued);
			height: 100%;
		}

		&:first-child::after {
			top: 8px;
			height: calc(100% - 8px);
		}

		&:last-child::after {
			height: 12px;
		}

		.inset {
			padding-top: 12px;
			padding-bottom: 32px;

			.v-detail + .v-detail {
				margin-top: 12px;
			}
		}

		.subdued {
			color: var(--theme--foreground-subdued);
		}
	}

	.mono {
		font-family: var(--theme--fonts--monospace--font-family);
		color: var(--theme--foreground-subdued);
	}

	.dot {
		position: absolute;
		top: 6px;
		left: -16px;
		z-index: 2;
		width: 12px;
		height: 12px;
		background-color: var(--theme--primary);
		border: var(--theme--border-width) solid var(--theme--background);
		border-radius: 8px;

		&.resolve {
			background-color: var(--theme--primary);
		}

		&.reject {
			background-color: var(--theme--secondary);
		}
	}
}

.empty {
	margin-left: 2px;
	color: var(--theme--foreground-subdued);
	font-style: italic;
}

.v-pagination {
	justify-content: center;
	margin-top: 24px;
}
</style>

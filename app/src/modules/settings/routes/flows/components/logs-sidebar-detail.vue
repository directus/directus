<template>
	<sidebar-detail :title="t('logs')" icon="fact_check" :badge="revisionsCount">
		<v-detail
			v-for="group in revisionsByDate"
			:key="group.dateFormatted"
			:label="group.dateFormatted"
			class="revisions-date-group"
			start-open
		>
			<div class="scroll-container">
				<button v-for="revision in group.revisions" :key="revision.id" class="log" @click="previewing = revision">
					{{ getTime(revision.activity.timestamp) }}
				</button>
			</div>
		</v-detail>
	</sidebar-detail>

	<v-drawer
		:model-value="!!previewing"
		:title="previewing ? d(previewing.activity.timestamp, 'long') : t('logs')"
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

				<div v-for="step of status" :key="step.id" class="step">
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

<script lang="ts" setup>
import { useRevisions } from '@/composables/use-revisions';
import { Action, FlowRaw } from '@directus/shared/types';
import { computed, ref, toRefs, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import { format } from 'date-fns';
import { getTriggers } from '../triggers';
import { getOperations } from '@/operations';

const { t, d } = useI18n();

interface Props {
	flow: FlowRaw;
}

const props = defineProps<Props>();

const { flow } = toRefs(props);

const { triggers } = getTriggers();
const { operations } = getOperations();

const usedTrigger = computed(() => {
	return triggers.find((trigger) => trigger.id === unref(flow).trigger);
});

const { revisionsByDate, revisionsCount } = useRevisions(
	ref('directus_flows'),
	computed(() => unref(flow).id),
	{
		action: Action.RUN,
	}
);

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

const status = computed(() => {
	if (!unref(previewing)?.data?.status) return [];
	const { status } = unref(previewing).data;

	return status.map(
		({ operation, status, key }: { operation: string; status: 'reject' | 'resolve' | 'unknown'; key: string }) => {
			const operationConfiguration = props.flow.operations.find((operationConfig) => operationConfig.id === operation);

			const operationType = operations.value.find((operation) => operation.id === operationConfiguration?.type);

			return {
				id: operation,
				name: operationConfiguration?.name ?? key,
				data: unref(previewing).data?.[key] ?? null,
				options: operationConfiguration?.options ?? null,
				operationType: operationType?.name ?? operationConfiguration?.type ?? '--',
				key,
				status,
			};
		}
	);
});

function getTime(timestamp: string) {
	return format(new Date(timestamp), String(t('date-fns_time')));
}
</script>

<style lang="scss" scoped>
.content {
	padding: var(--content-padding);
}

.log {
	display: block;
}

.json {
	background-color: var(--background-subdued);
	font-family: var(--family-monospace);
	border-radius: var(--border-radius);
	padding: 20px;
	margin-top: 20px;
}

.steps {
	position: relative;

	.step {
		position: relative;

		&::after {
			content: '';
			position: absolute;
			width: var(--border-width);
			left: -11px;
			top: 0;
			background-color: var(--border-subdued);
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
			color: var(--foreground-subdued);
		}
	}

	.mono {
		font-family: var(--family-monospace);
		color: var(--foreground-subdued);
	}

	.dot {
		position: absolute;
		top: 6px;
		left: -16px;
		z-index: 2;
		width: 12px;
		height: 12px;
		background-color: var(--primary);
		border: 2px solid var(--background-page);
		border-radius: 8px;

		&.resolve {
			background-color: var(--primary);
		}

		&.reject {
			background-color: var(--secondary);
		}
	}
}
</style>

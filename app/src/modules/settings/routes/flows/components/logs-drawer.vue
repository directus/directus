<script setup lang="ts">
import { getTriggers } from '../triggers';
import VDetail from '@/components/v-detail.vue';
import VDrawer from '@/components/v-drawer.vue';
import { useExtensions } from '@/extensions';
import { Revision } from '@/types/revisions';
import { FlowRaw } from '@directus/types';
import { computed, toRefs, unref } from 'vue';

const props = defineProps<{
	flow: FlowRaw;
	revision: Revision;
}>();

const { flow, revision } = toRefs(props);

const { triggers } = getTriggers();
const { operations } = useExtensions();

const usedTrigger = computed(() => {
	return triggers.find((trigger) => trigger.id === unref(flow).trigger);
});

const triggerData = computed(() => {
	if (!unref(revision)?.data) return { trigger: null, accountability: null, options: null };

	const { data } = unref(revision)?.data as any;

	return {
		trigger: data.$trigger,
		accountability: data.$accountability,
		options: flow.value.options,
	};
});

const emit = defineEmits(['close']);

const steps = computed(() => {
	if (!revision.value || !unref(revision)?.data?.steps) return [];
	const { steps } = revision.value.data as any;

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
				data: unref(revision)?.data?.data?.[key] ?? null,
				options: options ?? null,
				operationType: operationType?.name ?? operationConfiguration?.type ?? '--',
				key,
				status,
			};
		},
	);
});
</script>

<template>
	<VDrawer
		:model-value="!!revision"
		:title="revision ? revision.timestampFormatted : $t('logs')"
		icon="fact_check"
		@cancel="emit('close')"
	>
		<div class="content">
			<div class="steps">
				<div class="step">
					<div class="header">
						<span class="dot" />
						<span class="type-label">
							{{ $t('trigger') }}
							<span class="subdued">&nbsp;{{ usedTrigger?.name }}</span>
						</span>
					</div>

					<div class="inset">
						<VDetail v-if="triggerData.options" :label="$t('options')">
							<pre class="json">{{ triggerData.options }}</pre>
						</VDetail>

						<VDetail v-if="triggerData.trigger" :label="$t('payload')">
							<pre class="json">{{ triggerData.trigger }}</pre>
						</VDetail>

						<VDetail v-if="triggerData.accountability" :label="$t('accountability')">
							<pre class="json">{{ triggerData.accountability }}</pre>
						</VDetail>
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
						<VDetail v-if="step.options" :label="$t('options')">
							<pre class="json">{{ step.options }}</pre>
						</VDetail>

						<VDetail v-if="step.data !== null" :label="$t('payload')">
							<pre class="json">{{ step.data }}</pre>
						</VDetail>
					</div>
				</div>
			</div>
		</div>
	</VDrawer>
</template>

<style lang="scss" scoped>
.content {
	padding: var(--content-padding);
}

.json {
	background-color: var(--theme--background-subdued);
	font-family: var(--theme--fonts--monospace--font-family);
	border-radius: var(--theme--border-radius);
	padding: 20px;
	margin-block-start: 20px;
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
			inline-size: var(--theme--border-width);
			inset-inline-start: -11px;
			inset-block-start: 0;
			background-color: var(--theme--border-color-subdued);
			block-size: 100%;
		}

		&:first-child::after {
			inset-block-start: 8px;
			block-size: calc(100% - 8px);
		}

		&:last-child::after {
			block-size: 12px;
		}

		.inset {
			padding-block: 12px 32px;

			.v-detail + .v-detail {
				margin-block-start: 12px;
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
		inset-block-start: 6px;
		inset-inline-start: -16px;
		z-index: 2;
		inline-size: 12px;
		block-size: 12px;
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
</style>

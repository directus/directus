<script setup lang="ts">
import { useExtensions } from '@/extensions';
import { computed, toRefs, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getTriggers } from '../triggers';
import { FlowRaw } from '@directus/types';
import { useRevision } from '@/composables/use-revision';

const props = defineProps<{
	revisionId?: number;
	flow: FlowRaw;
}>();

const { revisionId, flow } = toRefs(props);

const { t } = useI18n();

const { triggers } = getTriggers();
const { operations } = useExtensions();

const usedTrigger = computed(() => {
	return triggers.find((trigger) => trigger.id === unref(flow).trigger);
});

const { revision, loading } = useRevision(revisionId);

const triggerData = computed(() => {
	if (!unref(revision)?.data) return { trigger: null, accountability: null, options: null };

	const { data } = unref(revision)?.data as any;

	return {
		trigger: data.$trigger,
		accountability: data.$accountability,
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
	<v-drawer
		:model-value="!!revisionId"
		:title="revision ? revision.timestampFormatted : t('logs')"
		icon="fact_check"
		@cancel="emit('close')"
		@esc="emit('close')"
	>
		<div class="content">
			<v-progress-linear v-if="!revision && loading" indeterminate />
			<div v-else class="steps">
				<div class="step">
					<div class="header">
						<span class="dot" />
						<span class="type-label">
							{{ t('trigger') }}
							<span class="subdued">&nbsp;{{ usedTrigger?.name }}</span>
						</span>
					</div>

					<div class="inset">
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

						<v-detail v-if="step.data !== null" :label="t('payload')">
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

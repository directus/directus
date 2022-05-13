<template>
	<v-workspace-panel
		v-bind="panel"
		:name="panel.panel_name"
		:icon="type === 'trigger' ? panel.icon : currentOperation?.icon"
		class="block-container"
		:class="[
			type,
			{
				'edit-mode': editMode,
				subdued: subdued || ((parent === undefined || parent.loner) && type === 'operation'),
				reject: isReject,
			},
		]"
		:edit-mode="editMode"
		:resizable="false"
		:show-options="type !== 'trigger'"
		:style="styleVars"
		always-update-position
		@edit="$emit('edit', panel)"
		@update="$emit('update', { edits: $event, id: panel.id })"
		@move="$emit('move', panel.id)"
		@delete="$emit('delete', panel.id)"
		@duplicate="$emit('duplicate', panel)"
		@pointerenter="pointerEnter"
		@pointerleave="pointerLeave"
	>
		<template #body>
			<div
				v-if="editMode || panel.id === '$trigger' || panel?.resolve"
				class="button add-resolve"
				x-small
				icon
				rounded
				@pointerdown.stop="pointerdown('resolve')"
			>
				<v-icon name="check_circle" />
			</div>
			<div v-if="editMode && !panel?.resolve && isHintVisible && !moving" class="hint resolve-hint">
				<div x-small icon rounded class="button-hint" @pointerdown.stop="pointerdown('resolve')">
					<v-icon name="add_circle_outline" />
				</div>
			</div>
			<div
				v-if="editMode && panel.id !== '$trigger'"
				x-small
				icon
				rounded
				class="button add-reject"
				@pointerdown.stop="pointerdown('reject')"
			>
				<v-icon name="cancel" />
			</div>
			<div
				v-if="editMode && panel.id !== '$trigger' && !panel?.reject && isHintVisible && !moving"
				class="hint reject-hint"
			>
				<div x-small icon rounded class="button-hint" @pointerdown.stop="pointerdown('reject')">
					<v-icon name="add_circle_outline" />
				</div>
			</div>

			<div
				v-if="panel.id !== '$trigger'"
				x-small
				icon
				rounded
				class="button attachment"
				:class="{ reject: parent?.type === 'reject' }"
				@pointerdown.stop="pointerdown('parent')"
			>
				<v-icon name="adjust" />
			</div>
		</template>
		<div v-if="typeof currentOperation?.preview === 'function'" class="block selectable">
			<div v-tooltip="panel.key" class="name">{{ panel.id === '$trigger' ? panel.options?.name : panel.name }}</div>
			<dl class="options-preview">
				<div
					v-for="{ label, text } of translate(currentOperation?.preview(panel.options ?? {}, { flow }))"
					:key="label"
				>
					<dt>{{ label }}</dt>
					<dd>{{ text }}</dd>
				</div>
				<v-button
					v-if="panel.id === '$trigger' && panel.type === 'manual'"
					:disabled="manualRunning"
					@click="manualTrigger"
				>
					{{ t('triggers.manual.click') }}
				</v-button>
			</dl>
		</div>
		<component
			:is="`operation-${currentOperation.id}`"
			v-else-if="currentOperation && 'id' in currentOperation"
			:options="currentOperation"
		/>
		<template v-if="panel.id === '$trigger'" #footer>
			<div class="status-footer" :class="flowStatus">
				<display-color
					v-tooltip="flowStatus === 'active' ? t('active') : t('inactive')"
					class="status-dot"
					:value="flowStatus === 'active' ? 'var(--primary)' : 'var(--foreground-subdued)'"
				/>

				<v-select
					v-if="editMode"
					class="flow-status-select"
					inline
					:model-value="flowStatus"
					:items="[
						{ text: t('active'), value: 'active' },
						{ text: t('inactive'), value: 'inactive' },
					]"
					@update:model-value="flowStatus = $event"
				/>

				<span v-else>
					{{ flowStatus === 'active' ? t('active') : t('inactive') }}
				</span>
			</div>
		</template>
	</v-workspace-panel>
</template>

<script lang="ts" setup>
import api from '@/api';
import { getOperations } from '@/operations';
import { translate } from '@/utils/translate-object-values';
import { unexpectedError } from '@/utils/unexpected-error';
import { Vector2 } from '@/utils/vector2';
import { FlowRaw } from '@directus/shared/types';
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { ATTACHMENT_OFFSET, REJECT_OFFSET, RESOLVE_OFFSET } from '../constants';
import { getTriggers } from '../triggers';

export type Target = 'resolve' | 'reject';
export type ArrowInfo = {
	id: string;
	pos: Vector2;
	type: Target;
};

const props = withDefaults(
	defineProps<{
		panel: Record<string, any>;
		type?: 'trigger' | 'operation';
		editMode?: boolean;
		parent?: { id: string; type: Target; loner: boolean };
		flow: FlowRaw;
		panelsToBeDeleted: string[];
		isHintVisible: boolean;
		subdued?: boolean;
	}>(),
	{
		type: 'operation',
		editMode: false,
		parent: undefined,
		isHintVisible: false,
		subdued: false,
	}
);

const { panelsToBeDeleted, isHintVisible } = toRefs(props);

const { operations } = getOperations();
const { triggers } = getTriggers();

const emit = defineEmits([
	'create',
	'preview',
	'edit',
	'update',
	'delete',
	'move',
	'duplicate',
	'arrow-move',
	'arrow-stop',
	'show-hint',
	'hide-hint',
	'flow-status',
]);

const { t } = useI18n();

const styleVars = {
	'--reject-left': REJECT_OFFSET.x + 'px',
	'--reject-top': REJECT_OFFSET.y + 'px',
	'--resolve-left': RESOLVE_OFFSET.x + 'px',
	'--resolve-top': RESOLVE_OFFSET.y + 'px',
	'--attachment-x': ATTACHMENT_OFFSET.x + 'px',
	'--attachment-y': ATTACHMENT_OFFSET.y + 'px',
};

const currentOperation = computed(() => {
	if (props.type === 'operation') return operations.value.find((operation) => operation.id === props.panel.type);
	else return triggers.find((trigger) => trigger.value === props.panel.type);
});

let down: Target | 'parent' | undefined = undefined;
let rafId: number | null = null;
let moving = ref(false);
let workspaceOffset: Vector2 = new Vector2(0, 0);

const isReject = computed(() => props.parent?.type === 'reject');

function pointerdown(target: Target | 'parent') {
	if (!props.editMode || (target === 'parent' && props.parent === undefined)) return;

	down = target;

	const rect = document.getElementsByClassName('workspace').item(0)?.getBoundingClientRect();
	if (rect) {
		workspaceOffset = new Vector2(rect.left, rect.top);
	}

	window.addEventListener('pointermove', pointermove);
	window.addEventListener('pointerup', pointerup);
}

const pointermove = (event: PointerEvent) => {
	rafId = window.requestAnimationFrame(() => {
		moving.value = true;
		if (!down) return;
		const arrowInfo: ArrowInfo =
			down === 'parent'
				? {
						id: props.parent?.id,
						type: props.parent?.type as Target,
						pos: new Vector2(
							Math.round((event.pageX - workspaceOffset.x) / 20) * 20,
							Math.round((event.pageY - workspaceOffset.y) / 20) * 20
						),
				  }
				: {
						id: props.panel.id,
						type: down,
						pos: new Vector2(
							Math.round((event.pageX - workspaceOffset.x) / 20) * 20,
							Math.round((event.pageY - workspaceOffset.y) / 20) * 20
						),
				  };

		emit('arrow-move', arrowInfo);
	});
};

function pointerup() {
	if (
		!moving.value &&
		((down === 'reject' && (!props.panel.reject || panelsToBeDeleted.value.includes(props.panel.reject))) ||
			(down === 'resolve' && (!props.panel.resolve || panelsToBeDeleted.value.includes(props.panel.resolve))))
	)
		emit('create', props.panel.id, down);
	moving.value = false;
	down = undefined;
	if (rafId) window.cancelAnimationFrame(rafId);

	emit('arrow-stop');

	window.removeEventListener('pointermove', pointermove);
	window.removeEventListener('pointerup', pointerup);
}

const flowStatus = computed({
	get() {
		return props.flow.status;
	},
	set(newVal: string) {
		emit('flow-status', newVal);
	},
});

/* Manual Trigger */
const manualRunning = ref(false);

async function manualTrigger() {
	manualRunning.value = true;
	try {
		await api.get(`/flows/trigger/${props.flow.id}`);
	} catch (error) {
		unexpectedError(error as Error);
	} finally {
		manualRunning.value = false;
	}
}

/* show hint buttons */
function pointerEnter() {
	if (!props.editMode) return;
	emit('show-hint', props.panel.id);
}
function pointerLeave() {
	if (!props.editMode) return;
	emit('hide-hint');
}
</script>

<style lang="scss" scoped>
.v-workspace-panel.block-container {
	position: relative;
	overflow: visible;
	padding: 4px;

	:deep(.header .name) {
		color: var(--primary);
	}

	.flow-status-select {
		pointer-events: all;
	}

	.block {
		padding: 0 12px;
		height: 100%;
		overflow-y: auto;

		.name {
			display: inline-block;
			font-size: 20px;
			color: var(--foreground-normal-alt);
			font-weight: 600;
			margin-bottom: 8px;
		}
	}

	&.trigger {
		border-color: var(--primary);
		box-shadow: 0 0 0 1px var(--primary);
		transition: var(--fast) var(--transition);
		transition-property: border-color, box-shadow;

		&::before {
			position: absolute;
			pointer-events: none;
			content: '';
			top: 0;
			bottom: 0;
			left: 0;
			right: 0;
			border-radius: 4px;
			z-index: -1;
			opacity: 0.2;
			box-shadow: 0 0 0 7px var(--primary);
		}

		&.subdued {
			border-color: var(--border-subdued);
			box-shadow: 0 0 0 1px var(--border-subdued);

			&::before {
				box-shadow: 0 0 0 7px var(--background-subdued);
				opacity: 1;
			}
		}
	}

	&:not(.edit-mode) .button {
		cursor: default;
	}

	.button-hint,
	.button {
		position: absolute;
		border-radius: 50%;

		cursor: pointer;
		z-index: 10;
	}

	.button-hint {
		width: 32px;
		height: 32px;
		padding: 4px;
	}

	.hint {
		position: absolute;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 20px 20px 20px 80px;
		transform: translate(-2px, calc(-50% - 2px));
	}

	.button {
		width: 20px;
		height: 20px;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--background-page);
		transform: translate(calc(-50% - 1px), calc(-50% - 2px));

		--v-icon-color: var(--primary);
	}

	.add-resolve,
	.resolve-hint {
		top: var(--resolve-top);
		left: var(--resolve-left);

		.button-hint {
			--v-icon-color: var(--primary);
		}
	}

	.add-reject,
	.reject-hint {
		top: var(--reject-top);
		left: var(--reject-left);

		--v-icon-color: var(--secondary);

		.button-hint {
			--v-icon-color: var(--secondary);
		}
	}

	.attachment {
		top: var(--attachment-y);
		left: var(--attachment-x);
	}

	&.reject {
		:deep(.header) {
			.v-icon {
				color: var(--secondary);
			}

			.name {
				color: var(--secondary);
			}
		}

		.attachment {
			--v-icon-color: var(--secondary);
		}
	}

	&.subdued {
		color: var(--foreground-subdued);

		:deep(.header) {
			.v-icon {
				color: var(--foreground-subdued);
			}
			.name {
				color: var(--foreground-subdued);
			}
		}

		.button {
			border-color: var(--foreground-subdued);
			--v-icon-color: var(--foreground-subdued);

			.dot {
				background-color: var(--foreground-subdued);
			}
		}
	}
}

.options-preview {
	> div {
		flex-wrap: wrap;
	}

	dt {
		flex-basis: 100%;
	}

	dd {
		font-family: var(--family-monospace);
		white-space: pre-wrap;
		line-break: anywhere;
	}
}

.status-footer {
	display: flex;
	gap: 8px;
}
</style>

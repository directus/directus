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
				loner: (parent === undefined || parent.loner) && type === 'operation',
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
			<div
				v-if="editMode || (panel.id !== '$trigger' && panel?.reject)"
				x-small
				icon
				rounded
				class="button add-reject"
				@pointerdown.stop="pointerdown('reject')"
			>
				<v-icon name="cancel" />
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
			<div class="name">{{ panel.id === '$trigger' ? panel.options?.name : panel.name }}</div>
			<dl class="options-preview">
				<div
					v-for="{ label, text } of translate(currentOperation?.preview(panel.options ?? {}, { flow }))"
					:key="label"
				>
					<dt>{{ label }}</dt>
					<dd>{{ text }}</dd>
				</div>
			</dl>
		</div>
		<component
			:is="`operation-${currentOperation.id}`"
			v-else-if="currentOperation && 'id' in currentOperation"
			:options="currentOperation"
		/>
		<template v-if="panel.id === '$trigger'" #footer>
			<v-select
				class="flow-status-select"
				:model-value="flowStatus"
				:items="[
					{ text: t('active'), value: 'active' },
					{ text: t('inactive'), value: 'inactive' },
				]"
				:disabled="saving"
				@update:model-value="flowStatus = $event"
			/>
		</template>
	</v-workspace-panel>
</template>

<script lang="ts" setup>
import { getOperations } from '@/operations';
import { translate } from '@/utils/translate-object-values';
import { Vector2 } from '@/utils/vector2';
import { FlowRaw } from '@directus/shared/types';
import { throttle } from 'lodash';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api';
import { useFlowsStore } from '@/stores';
import { unexpectedError } from '@/utils/unexpected-error';
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
	}>(),
	{
		type: 'operation',
		editMode: false,
		parent: undefined,
	}
);

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
	else return triggers.value.find((trigger) => trigger.value === props.panel.type);
});

let down: Target | 'parent' | undefined = undefined;
let moving = false;
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

const pointermove = throttle((event: PointerEvent) => {
	moving = true;
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
}, 20);

function pointerup() {
	if (!moving && ((down === 'reject' && !props.panel.reject) || (down === 'resolve' && !props.panel.resolve)))
		emit('create', props.panel.id, down);
	moving = false;
	down = undefined;

	emit('arrow-stop');

	window.removeEventListener('pointermove', pointermove);
	window.removeEventListener('pointerup', pointerup);
}

const flowsStore = useFlowsStore();

const flowStatus = computed({
	get() {
		return props.flow.status;
	},
	set(newVal: string) {
		toggleFlowStatus(newVal);
	},
});

const saving = ref(false);

async function toggleFlowStatus(value: string) {
	saving.value = true;
	try {
		await api.patch(`/flows/${props.flow.id}`, {
			status: value,
		});
		await flowsStore.hydrate();
	} catch (error) {
		unexpectedError(error as Error);
	} finally {
		saving.value = false;
	}
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

		.name {
			font-size: 20px;
			color: var(--foreground-normal-alt);
			font-weight: 600;
			margin-bottom: 8px;
		}
	}

	&.trigger {
		border-color: var(--primary);
		box-shadow: 0 0 0 1px var(--primary);

		&::before {
			position: absolute;
			pointer-events: none;
			content: '';
			top: 0;
			bottom: 0;
			left: 0;
			right: 0;
			border-radius: 2px;
			z-index: -1;
			opacity: 0.2;
			box-shadow: 0 0 0 7px var(--primary);
		}
	}

	&:not(.edit-mode) .button {
		cursor: default;
	}

	.button {
		position: absolute;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		display: flex;
		background-color: var(--background-page);
		justify-content: center;
		align-items: center;
		z-index: 10;
		transform: translate(calc(-50% - 1px), calc(-50% - 2px));

		cursor: pointer;

		--v-icon-color: var(--primary);
	}

	.add-resolve {
		top: var(--resolve-top);
		left: var(--resolve-left);
	}

	.add-reject {
		top: var(--reject-top);
		left: var(--reject-left);

		.v-icon {
			color: var(--secondary);
		}
	}

	.attachment {
		top: var(--attachment-y);
		left: var(--attachment-x);
	}

	&.loner {
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
		white-space: normal;
	}
}
</style>

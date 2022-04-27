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
				v-if="editMode || (panel.id === '$trigger' && panel?.resolve)"
				class="button add-resolve"
				x-small
				icon
				rounded
				@pointerdown.stop="pointerdown('resolve')"
			>
				<v-icon name="check_circle"></v-icon>
			</div>
			<div
				v-if="panel.id !== '$trigger'"
				x-small
				icon
				rounded
				class="button add-reject"
				@pointerdown.stop="pointerdown('reject')"
			>
				<v-icon name="cancel"></v-icon>
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
				<div class="dot" />
			</div>
		</template>
		<div
			v-if="typeof currentOperation?.preview === 'function'"
			v-md="translate(currentOperation?.preview(panel))"
			class="block selectable"
		></div>
		<component
			:is="`operation-${currentOperation.id}`"
			v-else-if="currentOperation && 'id' in currentOperation"
			:options="currentOperation"
		/>
	</v-workspace-panel>
</template>

<script lang="ts" setup>
import { getOperations } from '@/operations';
import { Vector2 } from '@/utils/vector2';
import { throttle } from 'lodash';
import { computed } from 'vue';
import { ATTACHMENT_OFFSET, REJECT_OFFSET, RESOLVE_OFFSET } from '../constants';
import { getTriggers } from '../triggers';
import { translate } from '@/utils/translate-object-values';

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
	}>(),
	{
		type: 'operation',
		editMode: false,
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
</script>

<style lang="scss" scoped>
.v-workspace-panel.block-container {
	position: relative;
	box-shadow: none;
	border: var(--border-width) solid var(--border-normal);
	background-color: var(--background-page);
	overflow: visible;

	&.editing.draggable {
		box-shadow: none;

		&:hover {
			box-shadow: none;
		}
	}

	:deep(.header .name) {
		color: var(--primary);
	}

	:deep(.block) {
		padding: 0px 20px;

		h1 {
			font-size: 20px;
			color: var(--foreground-normal-alt);
			font-weight: 600;
			margin-bottom: 4px;
		}
	}

	&.trigger {
		box-shadow: none;
		border: var(--border-width) solid var(--primary);

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

		&.running {
			&::before {
				animation-name: floating;
				animation-duration: 3s;
				animation-iteration-count: infinite;
				animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
				@keyframes floating {
					50% {
						box-shadow: 0 0 0 10px var(--primary);
					}
				}
			}
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

		.v-icon {
			color: var(--primary);
		}
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
		width: 20px;
		height: 20px;
		border: 3px solid var(--primary);
		cursor: default;
		top: var(--attachment-y);
		left: var(--attachment-x);
		display: flex;
		align-items: center;
		justify-content: center;
		transform: translate(calc(-50% + 1px), calc(-50% - 2px));

		&.reject {
			border-color: var(--secondary);

			.dot {
				background-color: var(--secondary);
			}
		}

		.dot {
			width: 6px;
			height: 6px;
			background-color: var(--primary);
			border-radius: 50%;
		}
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

			.v-icon {
				color: var(--foreground-subdued);
			}

			.dot {
				background-color: var(--foreground-subdued);
			}
		}
	}
}
</style>

<template>
	<v-workspace-tile
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
				v-if="editMode || panel?.resolve"
				class="button add-resolve"
				x-small
				icon
				rounded
				@pointerdown.stop="pointerdown('resolve')"
			>
				<v-icon v-tooltip="editMode && t('operation_handle_resolve')" name="check_circle" />
			</div>
			<transition name="fade">
				<div
					v-if="editMode && !panel?.resolve && !moving && (panel.id === '$trigger' || isHovered)"
					class="hint resolve-hint"
				>
					<div x-small icon rounded class="button-hint" @pointerdown.stop="pointerdown('resolve')">
						<v-icon v-tooltip="t('operation_handle_resolve')" name="add_circle_outline" />
					</div>
				</div>
			</transition>
			<div
				v-if="panel.id !== '$trigger' && (editMode || panel?.reject)"
				x-small
				icon
				rounded
				class="button add-reject"
				@pointerdown.stop="pointerdown('reject')"
			>
				<v-icon v-tooltip="editMode && t('operation_handle_reject')" name="cancel" />
			</div>
			<transition name="fade">
				<div
					v-if="editMode && !panel?.reject && !moving && panel.id !== '$trigger' && isHovered"
					class="hint reject-hint"
				>
					<div x-small icon rounded class="button-hint" @pointerdown.stop="pointerdown('reject')">
						<v-icon v-tooltip="t('operation_handle_reject')" name="add_circle_outline" />
					</div>
				</div>
			</transition>

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
		<v-error-boundary
			v-if="typeof currentOperation?.overview === 'function'"
			:name="`operation-overview-${currentOperation.id}`"
		>
			<div class="block">
				<options-overview :panel="panel" :current-operation="currentOperation" :flow="flow" />
			</div>

			<template #fallback="{ error: optionsOverviewError }">
				<div class="options-overview-error">
					<v-icon name="warning" />
					{{ t('unexpected_error') }}
					<v-error :error="optionsOverviewError" />
				</div>
			</template>
		</v-error-boundary>
		<v-error-boundary
			v-else-if="currentOperation && 'id' in currentOperation"
			:name="`operation-overview-${currentOperation.id}`"
		>
			<component :is="`operation-overview-${currentOperation.id}`" :options="currentOperation" />

			<template #fallback="{ error: operationOverviewError }">
				<div class="options-overview-error">
					<v-icon name="warning" />
					{{ t('unexpected_error') }}
					<v-error :error="operationOverviewError" />
				</div>
			</template>
		</v-error-boundary>
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
	</v-workspace-tile>
</template>

<script setup lang="ts">
import { useExtensions } from '@/extensions';
import { Vector2 } from '@/utils/vector2';
import { FlowRaw } from '@directus/types';
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { ATTACHMENT_OFFSET, REJECT_OFFSET, RESOLVE_OFFSET } from '../constants';
import { getTriggers } from '../triggers';
import OptionsOverview from './options-overview.vue';

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
		isHovered: boolean;
		subdued?: boolean;
	}>(),
	{
		type: 'operation',
		editMode: false,
		parent: undefined,
		isHovered: false,
		subdued: false,
	}
);

const { panelsToBeDeleted } = toRefs(props);

const { operations } = useExtensions();
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
	else return triggers.find((trigger) => trigger.id === props.panel.type);
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
	) {
		emit('create', props.panel.id, down);
	}

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
.v-workspace-tile.block-container {
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
			box-shadow: 0 0 0 10px var(--primary);

			animation-name: floating;
			animation-duration: 3s;
			animation-iteration-count: infinite;
			animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
			@keyframes floating {
				0% {
					box-shadow: 0 0 0 10px var(--primary);
					opacity: 0.2;
				}
				50% {
					box-shadow: 0 0 0 8px var(--primary);
					opacity: 0.3;
				}
				100% {
					box-shadow: 0 0 0 10px var(--primary);
					opacity: 0.2;
				}
			}
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
		padding: 20px 20px 20px 60px;
		transform: translate(-1px, calc(-50% - 2.5px));
	}

	.button {
		width: 20px;
		height: 20px;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--background-page);
		transform: translate(calc(-50% - 1px), calc(-50% - 1px));

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

		.button-hint {
			--v-icon-color: var(--foreground-subdued);
		}
	}
}

.options-overview-error {
	padding: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	width: 100%;
	height: 100%;

	--v-icon-color: var(--danger);

	.v-error {
		margin-top: 8px;
		max-width: 100%;
	}
}

.status-footer {
	display: flex;
	gap: 8px;
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity var(--fast) var(--transition);
}

.fade-enter-from,
.fade-leave-to {
	position: absolute;
	opacity: 0;
}
</style>

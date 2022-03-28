<template>
	<v-workspace-panel
		v-bind="panel"
		:name="panel.panel_name"
		class="block-container"
		:class="type"
		:edit-mode="editMode"
		:resizable="false"
		:show-options="type !== 'trigger'"
		:style="styleVars"
		alwaysUpdatePosition
		@edit="$emit('edit', panel)"
		@update="$emit('update', { edits: $event, id: panel.id })"
		@move="$emit('move', panel.id)"
		@delete="$emit('delete', panel.id)"
		@duplicate="$emit('duplicate', panel)"
	>
		<template #body>
			<template v-if="editMode">
				<div class="button add-resolve" x-small icon rounded @click="$emit('create', panel.id, 'resolve')">
				<v-icon name="check" small></v-icon>
				</div>
				<div x-small icon rounded class="button add-reject" @click="$emit('create', panel.id, 'reject')">
					<v-icon name="close" small></v-icon>
				</div>
				<div v-if="panel.id !== '$trigger'" x-small icon rounded class="button attachment">
					<div class="dot" />
				</div>
			</template>
		</template>
		<div class="block">{{ panel.name }}</div>
	</v-workspace-panel>
</template>

<script lang="ts" setup>
import { ATTACHMENT_OFFSET, REJECT_OFFSET, RESOLVE_OFFSET } from '../constants';

const props = withDefaults(
	defineProps<{
		panel: Record<string, any>;
		type?: 'trigger' | 'operation';
		editMode?: boolean;
	}>(),
	{
		type: 'operation',
		editMode: false,
	}
);

defineEmits(['create', 'edit', 'update', 'delete', 'move', 'duplicate']);

const styleVars = {
	'--reject-top': REJECT_OFFSET.x + 'px',
	'--reject-left': REJECT_OFFSET.y + 'px',
	'--resolve-top': RESOLVE_OFFSET.x + 'px',
	'--resolve-left': RESOLVE_OFFSET.y + 'px',
	'--attachment-x': ATTACHMENT_OFFSET.x + 'px',
	'--attachment-y': ATTACHMENT_OFFSET.y + 'px'
}

</script>

<style lang="scss" scoped>
.v-workspace-panel.block-container {
	position: relative;
	box-shadow: none;
	border: var(--border-width) solid var(--border-normal);
	background-color: var(--background-page);
	overflow: visible;

	.block {
		padding: 0px 20px;
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
			animation-name: floating;
			animation-duration: 3s;
			animation-iteration-count: infinite;
			animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
			z-index: -1;
			opacity: 0.2;
			box-shadow: 0 0 0 7px var(--primary);
			@keyframes floating {
				50% {
					box-shadow: 0 0 0 10px var(--primary);
				}
			}
		}
	}

	.button {
		position: absolute;
		border: var(--border-width) solid var(--primary);
		border-radius: 50%;
		width: 22px;
		height: 22px;
		display: flex;
		background-color: var(--background-page);
		justify-content: center;
		align-items: center;
		z-index: 10;
		transform: translate(-50%, -50%);

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
	}

	.attachment {
		cursor: default;
		color: var(--primary);
		top: var(--attachment-y);
		left: var(--attachment-x);
		display: flex;
		align-items: center;
		justify-content: center;

		.dot {
			width: 6px;
			height: 6px;
			background-color: var(--primary);
			border-radius: 50%;
		}
	}
}
</style>

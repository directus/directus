<template>
	<v-workspace-panel
		v-bind="panel"
		class="block-container"
		:class="type"
		:edit-mode="editMode"
		:resizable="false"
		@edit="$emit('edit', panel)"
		@update="$emit('update', { edits: $event, id: panel.id })"
		@move="$emit('move', panel.id)"
		@delete="$emit('delete', panel.id)"
		@duplicate="$emit('duplicate', panel)"
	>
		<template v-if="editMode" #body>
			<v-button class="add-resolve" x-small icon rounded>
				<v-icon name="add" small @click="$emit('create', 'resolve')"></v-icon>
			</v-button>
			<v-button v-if="type !== 'trigger'" class="add-reject" @click="$emit('create', 'reject')">
				<v-icon name="add"></v-icon>
			</v-button>
		</template>
		<div class="block">{{ type }}</div>
	</v-workspace-panel>
</template>

<script lang="ts" setup>
import { AppPanel } from '@/components/v-workspace-panel.vue';

const props = withDefaults(
	defineProps<{
		panel: AppPanel;
		type?: 'trigger' | 'operation' | 'error';
		editMode?: boolean;
	}>(),
	{
		type: 'operation',
		editMode: false,
	}
);

const emit = defineEmits(['create', 'edit', 'update', 'delete', 'move', 'duplicate']);
</script>

<style lang="scss" scoped>
.v-workspace-panel.block-container {
	position: relative;
	box-shadow: none;
	border: var(--border-width) solid var(--border-normal);
	background-color: var(--background-page);
	overflow: visible;

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
					box-shadow: 0 0 0 9px var(--primary);
				}
			}
		}
	}

	.add-resolve,
	.add-reject {
		transform: translate(-50%, -50%);
		z-index: 10;
	}

	.add-resolve {
		position: absolute;
		top: 50%;
		left: 100%;
	}

	.add-reject {
		position: absolute;
		top: 100%;
		left: 50%;
	}
}
</style>

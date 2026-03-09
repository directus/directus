<script setup lang="ts">
import type { CommandConfig } from './composables/use-command-registry';
import { computed } from 'vue';
import CommandPaletteItem from './command-palette-item.vue';

const props = defineProps<{
	command: CommandConfig;
}>();

defineEmits<{
	select: [];
}>();

const RenderIcon = computed(() => props.command.icon);
const RenderedCommand = computed(() => props.command.render);
</script>

<template>
	<CommandPaletteItem :value="command.id" @select="$emit('select')">
		<template #icon>
			<v-icon v-if="typeof command.icon === 'string'" :name="command.icon" />
			<RenderIcon v-else />
		</template>
		<template #description>
			<slot name="description">
				{{ command.description }}
			</slot>
		</template>
		<slot>
			<RenderedCommand v-if="command.render" />
			<div v-else v-md="command.name" />
		</slot>
	</CommandPaletteItem>
</template>

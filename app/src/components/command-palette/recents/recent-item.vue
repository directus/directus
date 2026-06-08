<script setup lang="ts">
import type { CommandConfig, GroupConfig } from '../composables/use-command-registry';
import { computed, toRefs } from 'vue';
import CommandPaletteItem from '../command-palette-item.vue';

const props = defineProps<{
	command: CommandConfig;
	group?: GroupConfig;
}>();

defineEmits<{
	select: [];
}>();

const { command } = toRefs(props);

const RenderedCommand = computed(() => command.value.render);
</script>

<template>
	<CommandPaletteItem :key="command.id" icon="history" :value="command.id" @select="$emit('select')">
		<div class="title-wrapper">
			<RenderedCommand v-if="command.render" />
			<div v-else v-md="command.name" />
			<span v-if="group" class="group">{{ group.name }}</span>
		</div>
		<template #description>
			{{ command.description }}
		</template>
	</CommandPaletteItem>
</template>

<style scoped lang="scss">
.title-wrapper {
	display: flex;
	justify-content: space-between;
	gap: 12px;
	overflow-x: hidden;
	text-overflow: ellipsis;

	.group {
		font-size: 12px;
		color: var(--theme--foreground-subdued);
	}
}
</style>

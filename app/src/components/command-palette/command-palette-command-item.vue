<script setup lang="ts">
import { computed } from 'vue';
import CommandPaletteItem from './command-palette-item.vue';
import type { CommandConfig } from './composables/use-command-registry';
import VIcon from '@/components/v-icon/v-icon.vue';

const props = defineProps<{
	command: CommandConfig;
	iconPlacement?: 'start' | 'end' | 'none';
}>();

defineEmits<{
	select: [];
}>();

const RenderIcon = computed(() => props.command.icon);
const RenderedCommand = computed(() => props.command.render);

const startIcon = computed(() =>
	props.iconPlacement === 'start' && typeof props.command.icon === 'string' ? props.command.icon : undefined,
);

const showStartIconSlot = computed(() => props.iconPlacement === 'start' && typeof props.command.icon !== 'string');
</script>

<template>
	<CommandPaletteItem :value="command.id" :icon="startIcon" @select="$emit('select')">
		<template v-if="showStartIconSlot" #icon>
			<RenderIcon />
		</template>
		<template #description>
			<slot name="description">
				{{ command.description }}
			</slot>
		</template>
		<slot>
			<span class="command-title" :class="{ 'has-end-label': command.endLabel }">
				<span class="command-name">
					<RenderedCommand v-if="command.render" />
					<span v-else v-md="command.name" />
					<span v-if="iconPlacement !== 'start' && iconPlacement !== 'none'" class="command-icon">
						<VIcon v-if="typeof command.icon === 'string'" :name="command.icon" />
						<RenderIcon v-else />
					</span>
				</span>
				<span v-if="command.endLabel" class="end-label">{{ command.endLabel }}</span>
			</span>
		</slot>
	</CommandPaletteItem>
</template>

<style scoped lang="scss">
.command-title {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	min-inline-size: 0;

	&.has-end-label {
		justify-content: space-between;
		inline-size: 100%;
	}
}

.command-name {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	min-inline-size: 0;
}

.command-icon {
	--v-icon-size: 1rem;
	--v-icon-color: var(--theme--foreground-subdued);

	display: inline-flex;
	align-items: center;
}

.end-label {
	flex: 0 0 auto;
	color: var(--theme--foreground-subdued);
	font-size: 0.75rem;
}
</style>

<script setup lang="ts">
import type { CommandConfig, GroupConfig } from '../composables/use-command-registry';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CommandPaletteGroup from '../command-palette-group.vue';
import { useRecentCommands } from '../composables/use-recent-commands';
import RecentItem from './recent-item.vue';

const { t } = useI18n();

const props = defineProps<{
	availableCommands: CommandConfig[];
	groups: GroupConfig[];
}>();

defineEmits<{
	select: [id: string];
}>();

const { commands: commandIds } = useRecentCommands();

const commands = computed(() =>
	commandIds.value
		.map((id) => props.availableCommands.find((cmd) => cmd.id === id))
		.filter(Boolean),
);
</script>

<template>
	<CommandPaletteGroup v-if="commands.length > 0" :heading="t('recent')">
		<RecentItem
			v-for="command in commands"
			:key="command!.id"
			:command="command!"
			:group="groups.find(({ id }) => id === command!.group)"
			@select="$emit('select', command!.id)"
		/>
	</CommandPaletteGroup>
</template>

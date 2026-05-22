<script setup lang="ts">
import { groupBy } from 'lodash';
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import CommandPaletteCommandItem from './command-palette-command-item.vue';
import CommandPaletteEmpty from './command-palette-empty.vue';
import CommandPaletteGroup from './command-palette-group.vue';
import CommandPaletteItem from './command-palette-item.vue';
import CommandPaletteList from './command-palette-list.vue';
import { useCommandPalette } from './composables/use-command-palette';
import type { CommandConfig } from './composables/use-command-registry';
import { useRegisteredCommands } from './composables/use-command-registry';
import { useCommandRouter } from './composables/use-command-router';
import { commandScore } from './composables/use-command-score';
import type { GlobalSearchResultItem } from './composables/use-global-search';
import { useGlobalSearch } from './composables/use-global-search';
import { useRecentCommands } from './composables/use-recent-commands';
import RecentItems from './recents/recent-items.vue';
import SearchHighlight from './search-highlight.vue';
import { useAiStore } from '@/ai/stores/use-ai';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { getItemRoute } from '@/utils/get-route';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const context = useCommandPalette();
const commandRouter = useCommandRouter();
const serverStore = useServerStore();
const settingsStore = useSettingsStore();

const commandContext = computed(() => ({
	route,
	search: context.search.value,
}));

const { search, clearSearch } = context;

const { add: addToRecents } = useRecentCommands();

const { groups, commands } = useRegisteredCommands(commandContext);

const globalSearch = useGlobalSearch(search);

// Sync global search loading state with palette loading indicator
watch(globalSearch.loading, (isLoading) => {
	context.loading.value = isLoading;
});

const filteredCommands = computed(() => {
	if (!search.value) return commands.value;

	return commands.value
		.map((command) => ({
			command,
			score: commandScore(command.name, search.value, command.keywords ?? []),
		}))
		.filter(({ score }) => score > 0.1)
		.sort((a, b) => {
			const priorityA = (a.command.priority ?? 0) * 0.01;
			const priorityB = (b.command.priority ?? 0) * 0.01;
			return b.score + priorityB - (a.score + priorityA);
		})
		.map(({ command }) => command);
});

const ungrouped = Symbol();
const groupIdsSet = computed(() => new Set(groups.value.map(({ id }) => id)));

const groupedCommands = computed(
	() =>
		groupBy(filteredCommands.value, ({ group }) =>
			groupIdsSet.value.has(group!) ? (group ?? ungrouped) : ungrouped,
		) as unknown as Record<string | symbol, typeof commands.value>,
);

const groupsWithCommands = computed(() => groups.value.filter(({ id }) => groupedCommands.value[id]));

const hasSearchResults = computed(() => globalSearch.results.value.length > 0);

const isEmpty = computed(
	() => !!search.value && filteredCommands.value.length === 0 && !globalSearch.loading.value && !hasSearchResults.value,
);

const aiAvailable = computed(() => serverStore.info.ai_enabled && settingsStore.availableAiProviders.length > 0);

function askAi() {
	const aiStore = useAiStore();
	aiStore.input = search.value;
	aiStore.chatOpen = true;
	aiStore.submit();
	context.close();
}

function navigateToItem(item: GlobalSearchResultItem) {
	router.push(getItemRoute(item.collection, item.pk));
	context.close();
}

async function onSelect(command: CommandConfig) {
	addToRecents(command.id);

	if (command.action) {
		const result = await command.action({ router });

		if (result !== false) {
			context.close();
		}
	} else if (command.component) {
		commandRouter.push({ component: command.component, props: command.props });
		clearSearch();
	}
}
</script>

<template>
	<CommandPaletteList>
		<CommandPaletteEmpty :show="isEmpty && !aiAvailable" />
		<CommandPaletteItem v-if="isEmpty && aiAvailable" value="ask-ai" icon="auto_awesome" @select="askAi">
			{{ t('command_ask_ai', { query: search }) }}
		</CommandPaletteItem>
		<RecentItems
			v-if="!search"
			:available-commands="commands"
			:groups="groups"
			@select="onSelect(commands.find((c) => c.id === $event)!)"
		/>
		<CommandPaletteGroup v-for="group in groupsWithCommands" :key="group.id" :heading="group.name" :icon="group.icon">
			<CommandPaletteCommandItem
				v-for="command in groupedCommands[group.id]"
				:key="command.id"
				:command="command"
				@select="onSelect(command)"
			/>
		</CommandPaletteGroup>
		<CommandPaletteCommandItem
			v-for="command in groupedCommands[ungrouped]"
			:key="command.id"
			:command="command"
			@select="onSelect(command)"
		/>
		<template v-if="search && hasSearchResults">
			<CommandPaletteGroup
				v-for="group in globalSearch.results.value"
				:key="`search-${group.collection}`"
				:heading="group.collectionName"
				:icon="group.icon"
			>
				<CommandPaletteItem
					v-for="item in group.items"
					:key="`${item.collection}-${item.pk}`"
					:value="`${item.collection}-${item.pk}`"
					:icon="group.icon"
					@select="navigateToItem(item)"
				>
					{{ item.displayValue }}
					<template v-if="item.descriptionValue" #description>
						<SearchHighlight :text="item.descriptionValue" :query="search" />
					</template>
				</CommandPaletteItem>
			</CommandPaletteGroup>
		</template>
	</CommandPaletteList>
</template>

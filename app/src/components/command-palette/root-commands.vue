<script setup lang="ts">
import { groupBy } from 'lodash';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import CommandPaletteCommandItem from './command-palette-command-item.vue';
import CommandPaletteEmpty from './command-palette-empty.vue';
import CommandPaletteGroup from './command-palette-group.vue';
import CommandPaletteItem from './command-palette-item.vue';
import CommandPaletteList from './command-palette-list.vue';
import { useAskAi } from './composables/use-ask-ai';
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
import AiMagicButton from '@/ai/components/ai-magic-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { getItemRoute } from '@/utils/get-route';
import { unexpectedError } from '@/utils/unexpected-error';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const context = useCommandPalette();
const commandRouter = useCommandRouter();
const { aiAvailable, askAi, askAiShortcutModifierIcon } = useAskAi();
const askAiHovering = ref(false);

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

function navigateToItem(item: GlobalSearchResultItem) {
	router.push(getItemRoute(item.collection, item.pk));
	context.close();
}

async function onSelect(command: CommandConfig) {
	addToRecents(command.id);

	if (command.action) {
		try {
			const result = await command.action({ router });

			if (result !== false) {
				context.close();
			}
		} catch (error) {
			unexpectedError(error);
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
				icon-placement="start"
				@select="onSelect(command)"
			/>
		</CommandPaletteGroup>
		<CommandPaletteGroup v-if="groupedCommands[ungrouped]?.length">
			<CommandPaletteCommandItem
				v-for="command in groupedCommands[ungrouped]"
				:key="command.id"
				:command="command"
				@select="onSelect(command)"
			/>
		</CommandPaletteGroup>
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
		<CommandPaletteGroup v-if="search && aiAvailable">
			<CommandPaletteItem
				value="ask-ai"
				@mouseenter="askAiHovering = true"
				@mouseleave="askAiHovering = false"
				@select="askAi(search)"
			>
				<template #icon>
					<AiMagicButton :animate="askAiHovering" class="ask-ai-icon" />
				</template>
				<span class="ask-ai-title">
					<span>{{ t('command_ask_ai', { query: search }) }}</span>
					<span class="ask-ai-shortcut">
						<VIcon :name="askAiShortcutModifierIcon" />
						<VIcon name="keyboard_return" />
					</span>
				</span>
			</CommandPaletteItem>
		</CommandPaletteGroup>
	</CommandPaletteList>
</template>

<style scoped lang="scss">
.ask-ai-title {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	min-inline-size: 0;
	inline-size: 100%;
}

.ask-ai-shortcut {
	--v-icon-size: 1rem;

	display: inline-flex;
	flex: 0 0 auto;
	align-items: center;
	gap: 0.25rem;
	color: var(--theme--foreground-subdued);
}

.ask-ai-icon {
	inline-size: 1.25rem;
	block-size: 1.25rem;
}
</style>

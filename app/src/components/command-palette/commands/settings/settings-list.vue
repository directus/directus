<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import CommandPaletteEmpty from '../../command-palette-empty.vue';
import CommandPaletteItem from '../../command-palette-item.vue';
import CommandPaletteList from '../../command-palette-list.vue';
import { useCommandPalette } from '../../composables/use-command-palette';
import { commandScore } from '../../composables/use-command-score';
import { useServerStore } from '@/stores/server';

interface SettingsSection {
	id: string;
	name: string;
	icon: string;
	to: string;
}

const { t } = useI18n();
const router = useRouter();
const serverStore = useServerStore();
const { search, close } = useCommandPalette();

const sections = computed<SettingsSection[]>(() => {
	const items: SettingsSection[] = [
		{ id: 'flows', name: t('settings_flows'), icon: 'bolt', to: '/settings/flows' },
		{ id: 'roles', name: t('settings_roles'), icon: 'group', to: '/settings/roles' },
		{ id: 'permissions', name: t('settings_permissions'), icon: 'admin_panel_settings', to: '/settings/policies' },
		{ id: 'project', name: t('settings_project'), icon: 'tune', to: '/settings/project' },
		{ id: 'appearance', name: t('settings_appearance'), icon: 'palette', to: '/settings/appearance' },
		{ id: 'global-search', name: t('global_search'), icon: 'search', to: '/settings/global-search' },
		{ id: 'presets', name: t('settings_presets'), icon: 'bookmark', to: '/settings/presets' },
		{ id: 'translations', name: t('settings_translations'), icon: 'translate', to: '/settings/translations' },
	];

	if (serverStore.info.ai_enabled || serverStore.info.mcp_enabled) {
		items.push({ id: 'ai', name: t('settings_ai'), icon: 'smart_toy', to: '/settings/ai' });
	}

	items.push(
		{ id: 'marketplace', name: t('marketplace'), icon: 'storefront', to: '/settings/marketplace' },
		{ id: 'extensions', name: t('extensions'), icon: 'category', to: '/settings/extensions' },
	);

	if (serverStore.info.websocket?.logs) {
		items.push({ id: 'system-logs', name: t('settings_system_logs'), icon: 'terminal', to: '/settings/system-logs' });
	}

	return items;
});

const filtered = computed(() => {
	if (!search.value) return sections.value;

	return sections.value
		.map((section) => ({ section, score: commandScore(section.name, search.value, []) }))
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score)
		.map(({ section }) => section);
});

const isEmpty = computed(() => !!search.value && filtered.value.length === 0);

function selectSection(section: SettingsSection) {
	router.push(section.to);
	close();
}
</script>

<template>
	<CommandPaletteList :search-bar-placeholder="t('settings') + '...'">
		<CommandPaletteEmpty :show="isEmpty" />
		<CommandPaletteItem
			v-for="section in filtered"
			:key="section.id"
			:value="section.id"
			:icon="section.icon"
			@select="selectSection(section)"
		>
			{{ section.name }}
		</CommandPaletteItem>
	</CommandPaletteList>
</template>

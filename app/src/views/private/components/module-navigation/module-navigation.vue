<script setup lang="ts">
import ModuleNavigationHeader from './module-navigation-header.vue';
import { computed } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { translate } from '@/utils/translate-object-values';
import { MODULE_BAR_DEFAULT } from '@/constants';
import { omit } from 'lodash';
import { useExtensions } from '@/extensions';
import { useRoute } from 'vue-router';

const route = useRoute();

const settingsStore = useSettingsStore();
const { modules: registeredModules } = useExtensions();

const registeredModuleIDs = computed(() => registeredModules.value.map((module) => module.id));

const modules = computed(() => {
	if (!settingsStore.settings) return [];

	return (settingsStore.settings.module_bar ?? MODULE_BAR_DEFAULT)
		.filter((modulePart) => {
			if (modulePart.type === 'link') return true;
			return modulePart.enabled && registeredModuleIDs.value.includes(modulePart.id);
		})
		.map((modulePart) => {
			if (modulePart.type === 'link') {
				const link = omit<Record<string, any>>(modulePart, ['url']);

				if (modulePart.url.startsWith('/')) {
					link.to = modulePart.url;
				} else {
					link.href = modulePart.url;
				}

				return translate(link);
			}

			const module = registeredModules.value.find((module) => module.id === modulePart.id)!;

			return {
				...modulePart,
				...registeredModules.value.find((module) => module.id === modulePart.id),
				to: `/${module.id}`,
			};
		});
});

const currentModule = computed(() => {
	return route.path.split('/')[1];
});
</script>

<template>
	<div class="module-nav alt-colors">
		<ModuleNavigationHeader />

		<div class="module-nav-content">
			<div v-for="modulePart in modules" :key="modulePart.id">
				<RouterLink v-if="modulePart.to" :to="modulePart.to">
					<div class="module">
						<v-icon :name="modulePart.icon" />
						{{ modulePart.name }}
					</div>
				</RouterLink>

				<component :is="`module-navigation-${modulePart.id}`" v-if="modulePart.navigation" />
			</div>

			<slot name="navigation" />
		</div>
	</div>
</template>

<style scoped>
.module-nav {
	position: relative;
	display: inline-block;
	width: 280px;
	height: 100%;
	font-size: 1rem;
	background-color: var(--background-normal);
	padding: 8px;
}

.module-nav-content {
	--v-list-item-background-color-hover: var(--background-normal-alt);
	--v-list-item-background-color-active: var(--background-normal-alt);

	height: calc(100% - 64px);
	overflow-x: hidden;
	overflow-y: auto;
}
</style>

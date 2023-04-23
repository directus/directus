<template>
	<div class="module-bar">
		<module-bar-logo />

		<div class="modules">
			<v-button
				v-for="modulePart in modules"
				:key="modulePart.id"
				v-tooltip.right="modulePart.name"
				icon
				x-large
				:to="modulePart.to"
				:href="modulePart.href"
				tile
				:style="
					modulePart.color
						? {
								'--v-button-color-active': modulePart.color,
						  }
						: null
				"
			>
				<v-icon :name="modulePart.icon" />
			</v-button>
		</div>

		<module-bar-avatar />
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ModuleBarLogo from './module-bar-logo.vue';
import ModuleBarAvatar from './module-bar-avatar.vue';
import { useSettingsStore } from '@/stores/settings';
import { translate } from '@/utils/translate-object-values';
import { MODULE_BAR_DEFAULT } from '@/constants';
import { omit } from 'lodash';
import { useExtensions } from '@/extensions';

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
</script>

<style lang="scss" scoped>
.module-bar {
	display: flex;
	flex-direction: column;
	width: 60px;
	height: 100%;
	background-color: var(--module-background);

	.modules {
		flex-grow: 1;
		overflow-x: hidden;
		overflow-y: auto;
	}

	.v-button {
		--v-button-color: var(--module-icon);
		--v-button-color-hover: var(--white);
		--v-button-color-active: var(--module-icon-alt);
		--v-button-background-color: var(--module-background);
		--v-button-background-color-hover: var(--module-background);
		--v-button-background-color-active: var(--module-background-alt);
	}
}
</style>

<script setup lang="ts">
import { omit } from 'lodash';
import { computed } from 'vue';
import ModuleBarAvatar from './module-bar-avatar.vue';
import ModuleBarButton from './module-bar-button.vue';
import ModuleBarLogo from './module-bar-logo.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { MODULE_BAR_DEFAULT } from '@/constants';
import { useExtensions } from '@/extensions';
import { useSettingsStore } from '@/stores/settings';
import { translate } from '@/utils/translate-object-values';

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

<template>
	<div class="module-bar">
		<ModuleBarLogo />

		<div class="modules">
			<ModuleBarButton
				v-for="modulePart in modules"
				:key="modulePart.id"
				v-tooltip.right="modulePart.name"
				:to="modulePart.to"
				:href="modulePart.href"
			>
				<VIcon :name="modulePart.icon" />
			</ModuleBarButton>
		</div>

		<ModuleBarAvatar />
	</div>
</template>

<style lang="scss" scoped>
.module-bar {
	--module-bar-width: 3.375rem;
	--module-bar-gap: 1.375rem;
	--focus-ring-color: var(--theme--navigation--modules--button--foreground);

	display: flex;
	flex-direction: column;
	inline-size: var(--module-bar-width);
	block-size: 100%;
	background-color: var(--theme--navigation--modules--background);
	border-inline-end: var(--theme--navigation--modules--border-width) solid
		var(--theme--navigation--modules--border-color);

	/* Explicitly render the border outside of the width of the bar itself */
	box-sizing: content-box;

	.modules {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex-grow: 1;
		padding-block: calc(var(--module-bar-gap) / 2);
		gap: var(--module-bar-gap);
		overflow: hidden auto;
	}
}

.module-bar-logo {
	--focus-ring-color: var(--foreground-inverted);
}
</style>

<script setup lang="ts">
import VResizeable from '@/components/v-resizeable.vue';
import { MODULE_BAR_DEFAULT } from '@/constants';
import { useExtensions } from '@/extensions';
import { useAppStore, useSettingsStore } from '@/stores';
import { translate } from '@/utils/translate-object-values';
import { debounce, omit } from 'lodash';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import ModuleNavigationHeader from './module-navigation-header.vue';

const route = useRoute();

const appStore = useAppStore();
const settingsStore = useSettingsStore();
const { modules: registeredModules } = useExtensions();

const { navOpen } = storeToRefs(appStore);

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

const { data: localStorageModuleWidth } = useLocalStorage<{
	nav?: number;
	main?: number;
}>('module-width', {});

const navWidth = ref(getWidth(localStorageModuleWidth.value?.nav, SIZES.minModuleNavWidth));

watch(
	navWidth,
	debounce((value) => {
		localStorageModuleWidth.value = {
			...(localStorageModuleWidth.value ?? {}),
			nav: value,
		};
	}, 300)
);
</script>

<template>
	<aside id="navigation" role="navigation" aria-label="Module Navigation" :class="{ 'is-open': navOpen }">
		<v-resizeable
			v-model:width="navWidth"
			:min-width="SIZES.minModuleNavWidth"
			:max-width="maxWidthNav"
			:options="navResizeOptions"
			@dragging="(value) => (isDraggingNav = value)"
			@transition-end="resetContentOverflowX"
		>
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

						<transition-expand>
							<component
								:is="`module-navigation-${modulePart.id}`"
								v-if="modulePart.navigation && currentModule === modulePart.id"
							/>
						</transition-expand>
					</div>

					<slot name="navigation" />
				</div>
			</div>
		</v-resizeable>
	</aside>

	<v-overlay class="nav-overlay" :active="navOpen" @click="navOpen = false" />
</template>

<style scoped>
#navigation {
	position: fixed;
	top: 0;
	left: 0;
	z-index: 50;
	display: flex;
	height: 100%;
	font-size: 0;
	transform: translateX(-100%);
	transition: transform var(--slow) var(--transition);
}

#navigation.is-open {
	transform: translateX(0);
}

#navigation.has-shadow {
	box-shadow: var(--navigation-shadow);
}

@media (min-width: 960px) {
	#navigation {
		position: relative;
		transform: none;
	}
}

.module-nav {
	position: relative;
	display: inline-block;
	width: 280px;
	height: 100%;
	font-size: 1rem;
	background-color: var(--background-normal);
	padding: 8px;
	overflow-y: auto;
}

.module-nav-content {
	--v-list-item-background-color-hover: var(--background-normal-alt);
	--v-list-item-background-color-active: var(--background-normal-alt);
}
</style>

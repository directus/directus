<template>
	<div class="module-bar">
		<module-bar-logo />
		<v-button v-for="module in modules" :key="module.id" icon x-large :to="module.to">
			<v-icon :name="module.icon" />
		</v-button>
	</div>
</template>

<script lang="ts">
import { createComponent, computed } from '@vue/composition-api';
import ModuleBarLogo from './_module-bar-logo.vue';
import { useExtensionsStore } from '@/stores/extensions/';
import { useProjectsStore } from '@/stores/projects';

export default createComponent({
	components: {
		ModuleBarLogo
	},
	setup() {
		const extensionsStore = useExtensionsStore();
		const projectsStore = useProjectsStore();
		const { currentProjectKey } = projectsStore.state;

		const modules = computed(() =>
			extensionsStore.state.modules.map(module => ({
				...module,
				to: `/${currentProjectKey}/${module.id}/`
			}))
		);

		return { modules: modules };
	}
});
</script>

<style lang="scss" scoped>
.module-bar {
	width: 64px;
	height: 100%;
	background-color: #263238;

	.v-button {
		--v-button-color: var(--blue-grey-400);
	}
}
</style>

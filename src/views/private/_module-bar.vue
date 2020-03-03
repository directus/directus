<template>
	<div class="module-bar">
		<module-bar-logo />
		<v-button v-for="module in _modules" :key="module.id" icon x-large :to="module.to">
			<v-icon :name="module.icon" />
		</v-button>
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import ModuleBarLogo from './_module-bar-logo.vue';
import { useProjectsStore } from '@/stores/projects';
import { modules } from '@/modules/';

export default defineComponent({
	components: {
		ModuleBarLogo
	},
	setup() {
		const projectsStore = useProjectsStore();
		const { currentProjectKey } = projectsStore.state;

		const _modules = modules.map(module => ({
			...module,
			to: `/${currentProjectKey}/${module.id}/`
		}));

		return { _modules };
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

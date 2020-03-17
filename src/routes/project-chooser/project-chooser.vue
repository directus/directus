<template>
	<public-view>
		<h1 class="type-heading-large">{{ $t('choose_project') }}</h1>

		<v-button v-for="project in projects" :to="project.link" full-width :key="project.key">
			{{ (project.api && project.api.project_name) || project.key }}
		</v-button>
	</public-view>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { useProjectsStore } from '@/stores/projects';

export default defineComponent({
	name: 'project-chooser',
	props: {},
	setup() {
		const projectsStore = useProjectsStore();

		const projects = projectsStore.state.projects?.map(project => ({
			...project,
			link: `/${project.key}/login`
		}));

		return { projects };
	}
});
</script>

<style lang="scss" scoped>
.v-button:not(:last-child) {
	margin-bottom: 32px;
}

h1 {
	margin-bottom: 44px;
}
</style>

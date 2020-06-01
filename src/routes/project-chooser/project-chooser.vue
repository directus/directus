<template>
	<public-view>
		<router-link class="project" v-for="project in projects" :to="project.link" :key="project.key">
			<div class="logo" v-if="project && project.logo" :style="{ backgroundColor: project.color }">
				<img :src="project.logo" :alt="project.name || project.key" />
			</div>
			<img v-else class="default-logo" src="@/assets/logo-dark.svg" alt="Directus" />
			<div class="name type-title">
				{{ project.name || project.key }}
			</div>
		</router-link>

		<v-divider />

		<router-link to="/install" class="project new">
			<div class="logo">
				<v-icon name="add" />
			</div>
			<div class="name type-title">{{ $t('create_project') }}</div>
		</router-link>
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

		const projects = projectsStore.formatted.value?.map((project) => ({
			...project,
			link: `/${project.key}/login`,
		}));

		return { projects };
	},
});
</script>

<style lang="scss" scoped>
.v-button:not(:last-child) {
	margin-bottom: 32px;
}

h1 {
	margin-bottom: 44px;
}

.project {
	display: flex;
	align-items: center;
	height: 64px;
	margin-bottom: 12px;
}

.logo {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 64px;
	height: 64px;
	border-radius: var(--border-radius);
}

.default-logo {
	width: 64px;
}

.name {
	margin-left: 12px;
	color: var(--foreground-subdued);
	transition: color var(--fast) var(--transition);
}

.v-divider {
	margin: 20px 0;
}

.project.new {
	.logo {
		background-color: var(--background-normal);
	}

	.v-icon {
		color: var(--foreground-subdued);
	}
}

.project:hover .name {
	color: var(--foreground);
}
</style>

<template>
	<div class="public-view">
		<div class="container">
			<public-view-logo :version="version" />
			<div class="content" :class="{ wide }">
				<slot />
			</div>
			<div class="notice">
				<slot name="notice" />
			</div>
		</div>
		<div class="art" :style="artStyles"></div>
	</div>
</template>

<script lang="ts">
import { version } from '../../../package.json';
import { defineComponent, computed } from '@vue/composition-api';
import PublicViewLogo from './components/logo/';
import { useProjectsStore } from '@/stores/projects/';
import { ProjectWithKey, ProjectError } from '@/stores/projects/types';

export default defineComponent({
	components: {
		PublicViewLogo,
	},
	props: {
		wide: {
			type: Boolean,
			default: false,
		},
	},
	setup() {
		const projectsStore = useProjectsStore();

		const backgroundStyles = computed<string>(() => {
			const defaultColor = '#263238';

			let currentProject = projectsStore.currentProject.value;

			if (currentProject === null) {
				return defaultColor;
			}

			if ((currentProject as ProjectError).error !== undefined) {
				return defaultColor;
			}

			currentProject = currentProject as ProjectWithKey;

			if (currentProject.api.project_background?.full_url) {
				return `url(${currentProject.api.project_background.full_url})`;
			}

			return currentProject.api.project_color;
		});

		const artStyles = computed(() => ({
			background: backgroundStyles.value,
			backgroundSize: 'cover',
			backgroundPosition: 'center center',
		}));

		return { version, artStyles };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

.public-view {
	display: flex;
	width: 100%;
	height: 100%;

	.container {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		width: 100%;
		max-width: 500px;
		height: 100%;
		padding: 20px;
		overflow-x: hidden;
		overflow-y: auto;
		background-color: var(--white);
		box-shadow: 0 0 40px 0 rgba(0, 0, 0, 0.25);

		&.wide {
			max-width: 872px;
		}

		@include breakpoint(small) {
			padding: 40px 80px;
		}
	}

	.art {
		display: none;
		flex-grow: 1;
		height: 100%;
		background-position: center center;
		background-size: cover;

		@include breakpoint(small) {
			display: block;
		}
	}

	.notice {
		color: #b0bec5;
	}
}
</style>

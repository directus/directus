<template>
	<div class="public-view">
		<div class="container" :class="{ wide }">
			<project-chooser />
			<div class="content">
				<slot />
			</div>
			<div class="notice">
				<slot name="notice" />
			</div>
		</div>
		<div class="art" :style="artStyles">
			<transition name="scale">
				<img
					class="foreground"
					v-if="project && project.foregroundImage"
					:src="project.foregroundImage"
					:alt="project.name"
				/>
			</transition>
			<div class="note" v-if="project && project.note" v-html="marked(project.note)" />
		</div>
	</div>
</template>

<script lang="ts">
import { version } from '../../../package.json';
import { defineComponent, computed } from '@vue/composition-api';
import ProjectChooser from './components/project-chooser/';
import { useProjectsStore } from '@/stores/projects/';
import marked from 'marked';

export default defineComponent({
	components: {
		ProjectChooser,
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

			if (projectsStore.currentProject.value === null) {
				return defaultColor;
			}

			if (projectsStore.currentProject.value.error) {
				return defaultColor;
			}

			if (projectsStore.currentProject.value.backgroundImage) {
				return `url(${projectsStore.currentProject.value.backgroundImage})`;
			}

			return projectsStore.currentProject.value.color || defaultColor;
		});

		const artStyles = computed(() => ({
			background: backgroundStyles.value,
			backgroundSize: 'cover',
			backgroundPosition: 'center center',
		}));

		return { version, artStyles, marked, project: projectsStore.currentProject };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

.public-view {
	display: flex;
	width: 100%;
	height: 100%;
	color: #263238;

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
		background-color: #fff;
		box-shadow: 0 0 40px 0 rgba(0, 0, 0, 0.25);
		transition: max-width var(--medium) var(--transition);

		.content {
			width: 340px;
		}

		&.wide {
			max-width: 872px;

			.content {
				width: 712px;
			}
		}

		@include breakpoint(small) {
			padding: 40px 80px;
		}
	}

	.art {
		position: relative;
		display: none;
		flex-grow: 1;
		align-items: center;
		justify-content: center;
		height: 100%;
		background-position: center center;
		background-size: cover;

		.foreground {
			max-width: 400px;
		}

		.note {
			position: absolute;
			right: 0;
			bottom: 40px;
			left: 0;
			max-width: 340px;
			margin: 0 auto;
			padding: 8px 12px;
			color: var(--white);
			background-color: #2632383f;
			border-radius: var(--border-radius);
			backdrop-filter: blur(10px);
		}

		@include breakpoint(small) {
			display: flex;
		}
	}

	.notice {
		color: #b0bec5;
	}
}

.scale-enter-active,
.scale-leave-active {
	transition: all 600ms var(--transition);
}

.scale-enter,
.scale-leave-to {
	position: absolute;
	transform: scale(0.95);
	opacity: 0;
}
</style>

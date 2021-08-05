<template>
	<div class="project-info">
		<latency-indicator />
		<div class="project-selector">
			<span class="project-name">{{ name }}</span>
			<span v-if="saas" class="project-organism">
				<span class="project-organism__label">Inmobiliaria Alemany</span>
				<div class="project-organism__icon">
					<v-icon :small="true" name="expand_more" />
				</div>
			</span>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import LatencyIndicator from '../latency-indicator';
import { useServerStore, useSettingsStore } from '@/stores/';

export default defineComponent({
	components: { LatencyIndicator },
	setup() {
		const serverStore = useServerStore();

		const name = computed(() => serverStore.info?.project?.project_name);
		const saas = computed(() => serverStore.info?.project?.saas_mode === true);

		return { name, saas };
	},
});
</script>

<style lang="scss" scoped>
.project-info {
	position: relative;
	display: flex;
	align-items: center;
	width: 100%;
	height: 64px;
	padding: 0 20px;
	color: var(--foreground-normal-alt);
	text-align: left;
	background-color: var(--background-normal-alt);

	.project-selector {
		flex-grow: 1;
		margin-left: 12px;

		& .project-organism {
			display: flex;
			align-items: center;
			font-size: 0.8rem;
			transition: 0.2s linear color;

			&:hover {
				color: var(--sidebar-detail-color-active);
			}

			&__label {
				padding-right: 0.1rem;
			}
		}
	}
}
</style>

<script setup lang="ts">
import { useBreakpoints } from '@vueuse/core';
import { RouterView } from 'vue-router';
import ModuleBar from './components/module-bar.vue';
import SkipMenu from './components/skip-menu.vue';
import { BREAKPOINTS } from '@/constants';

const { lg } = useBreakpoints(BREAKPOINTS);
</script>

<template>
	<div class="private-layout">
		<template v-if="lg">
			<SkipMenu section="navigation" />
			<ModuleBar id="navigation" class="module-bar" />
		</template>
		<div class="route-content">
			<RouterView />
		</div>
	</div>
</template>

<style scoped>
.private-layout {
	block-size: 100%;
	display: flex;
}

.module-bar {
	flex-shrink: 0;
}

.route-content {
	flex: 1;
	min-inline-size: 0;
	block-size: 100%;
}
</style>

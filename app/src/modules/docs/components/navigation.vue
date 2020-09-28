<template>
	<v-list nav>
		<navigation-item v-for="item in sections" :key="item.to" :section="item"></navigation-item>
	</v-list>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import NavigationItem from './navigation-item.vue';
import sections from './sections';

export default defineComponent({
	components: { NavigationItem },
	setup() {
		return { sections };
	},
});
</script>

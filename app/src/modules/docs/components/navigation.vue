<template>
	<v-list large>
		<navigation-item v-for="item in navSections" :key="item.name" :section="item" />
	</v-list>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import NavigationItem from './navigation-item.vue';
import { nav } from '@directus/docs';

export default defineComponent({
	components: { NavigationItem },
	setup() {
		return { navSections: nav.app };
	},
});
</script>

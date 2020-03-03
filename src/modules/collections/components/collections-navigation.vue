<template>
	<v-list nav dense>
		<v-list-item v-for="navItem in navItems" :key="navItem.to" :to="navItem.to">
			<v-list-item-content>
				{{ navItem.name }}
			</v-list-item-content>
		</v-list-item>
	</v-list>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import VueI18n from 'vue-i18n';
import useNavigation from '../compositions/use-navigation';

export default defineComponent({
	props: {},
	setup() {
		const { navItems } = useNavigation();

		return { navItems };
	}
});
</script>

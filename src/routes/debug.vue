<template>
	<private-view>
		<button @click="forceLogout">Do wrong request</button>
	</private-view>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import api from '@/api';

export default defineComponent({
	props: {},
	setup() {
		return { forceLogout };

		function forceLogout() {
			api.get('https://demo.directus.io/thumper/items/mailing_list');
		}
	},
});
</script>

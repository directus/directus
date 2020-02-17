<template>
	<private-view>
		Hello!
	</private-view>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api';
import PrivateView from '@/views/private/';

export default createComponent({
	components: {
		PrivateView
	},
	props: {},
	setup() {
		return {};
	}
});
</script>

<template>
	<public-view>
		Hello!
	</public-view>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api';
import PublicView from '@/views/public/';

export default createComponent({
	components: {
		PublicView
	},
	props: {},
	setup() {
		return {};
	}
});
</script>

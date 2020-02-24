<template>
	<private-view>
		<template #navigation>
			Nav
		</template>

		Collections

		<template #drawer>
			Drawer
		</template>
	</private-view>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api';

export default createComponent({
	props: {},
	setup() {
		return {};
	}
});
</script>

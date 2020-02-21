<template>
	<public-view>
		<p>
			This is where you would be asked to choose the project you're trying to login to, or
			enter the project key if the project is private
		</p>
	</public-view>
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

<style lang="scss" scoped>
p {
	color: red;
}
</style>

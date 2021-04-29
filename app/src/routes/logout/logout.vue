<template>
	<div class="logout">
		<v-progress-circular indeterminate />
	</div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { logout } from '@/auth';

export default defineComponent({
	setup() {
		onMounted(() => {
			logout();
		});
	},
});
</script>

<style lang="scss" scoped>
.logout {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
}
</style>

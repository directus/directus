<script setup lang="ts">
import { logout } from '@/auth';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { onMounted } from 'vue';

onMounted(() => {
	logout();
});
</script>

<template>
	<div class="logout">
		<VProgressCircular indeterminate />
	</div>
</template>

<style lang="scss" scoped>
.logout {
	display: flex;
	align-items: center;
	justify-content: center;
	inline-size: 100%;
	block-size: 100%;
}
</style>

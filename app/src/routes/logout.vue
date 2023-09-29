<script setup lang="ts">
import { logout } from '@/auth';
import { onMounted } from 'vue';

onMounted(() => {
	logout();
});
</script>

<template>
	<div class="logout">
		<v-progress-circular indeterminate />
	</div>
</template>

<style lang="scss" scoped>
.logout {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
}
</style>

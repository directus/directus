<template>
	<div class="logout">
		<v-progress-circular indeterminate />
	</div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from '@vue/composition-api';
import { logout } from '@/auth';

export default defineComponent({
	setup() {
		onMounted(() => {
			logout();
		});
	}
});
</script>

<style lang="scss" scoped>
.logout {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>

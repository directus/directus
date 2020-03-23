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
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
}
</style>

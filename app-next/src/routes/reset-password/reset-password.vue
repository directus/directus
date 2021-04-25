<template>
	<public-view>
		<h1 class="type-title">{{ $t('reset_password') }}</h1>

		<request-form v-if="!resetToken" />
		<reset-form :token="resetToken" v-else />

		<template #notice>
			<v-icon name="lock_outlined" left />
			{{ $t('not_authenticated') }}
		</template>
	</public-view>
</template>

<script lang="ts">
import router from '@/router';
import { defineComponent, computed } from '@vue/composition-api';
import RequestForm from './request.vue';
import ResetForm from './reset.vue';

export default defineComponent({
	components: { RequestForm, ResetForm },
	setup() {
		const resetToken = computed(() => router.currentRoute.query.token);

		return {
			resetToken,
		};
	},
});
</script>

<style lang="scss" scoped>
h1 {
	margin-bottom: 20px;
}
</style>

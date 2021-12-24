<template>
	<public-view>
		<h1 class="type-title">{{ t('reset_password') }}</h1>

		<request-form v-if="!resetToken" />
		<reset-form v-else :token="resetToken" />

		<template #notice>
			<v-icon name="lock_outlined" left />
			{{ t('not_authenticated') }}
		</template>
	</public-view>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { defineComponent, computed } from 'vue';
import RequestForm from './request.vue';
import ResetForm from './reset.vue';

export default defineComponent({
	components: { RequestForm, ResetForm },
	setup() {
		const { t } = useI18n();

		const route = useRoute();

		const resetToken = computed(() => route.query.token);

		return { t, resetToken };
	},
});
</script>

<style lang="scss" scoped>
h1 {
	margin-bottom: 20px;
}
</style>

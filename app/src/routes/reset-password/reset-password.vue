<script setup lang="ts">
import { useHead } from '@unhead/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import RequestForm from './request.vue';
import ResetForm from './reset.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import PublicView from '@/views/public';

const { t } = useI18n();

const route = useRoute();

const resetToken = computed(() => (Array.isArray(route.query.token) ? route.query.token[0] : route.query.token));

useHead({
	title: t('reset_password'),
});
</script>

<template>
	<PublicView>
		<h1 class="type-title">{{ $t('reset_password') }}</h1>

		<RequestForm v-if="!resetToken" />
		<ResetForm v-else :token="resetToken" />

		<template #notice>
			<VIcon name="lock" left />
			{{ $t('not_authenticated') }}
		</template>
	</PublicView>
</template>

<style lang="scss" scoped>
h1 {
	margin-block-end: 20px;
}
</style>

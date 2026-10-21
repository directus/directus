<script setup lang="ts">
import { DIRECTUS_SECURITY_BEST_PRACTICES_URL } from '@directus/constants';
import { I18nT } from 'vue-i18n';
import VNotice from '@/components/v-notice.vue';
</script>

<template>
	<VNotice class="public-policy-notice" type="warning">
		<I18nT keypath="public_policy_warning" tag="span">
			<template #docs>
				<a :href="DIRECTUS_SECURITY_BEST_PRACTICES_URL" target="_blank" rel="noopener noreferrer">
					{{ $t('public_policy_warning_docs_link') }}
				</a>
			</template>
		</I18nT>
	</VNotice>
</template>

<style lang="scss" scoped>
.public-policy-notice {
	max-inline-size: calc(var(--form-column-max-width) * 2 + var(--theme--form--column-gap));

	a {
		text-decoration: underline;
		color: var(--theme--primary);
	}
}
</style>

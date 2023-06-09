<script setup lang="ts">
import { useAppStore } from '@directus/stores';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

const { t, te } = useI18n();

interface LoginNoticeProps {
	logoutReason?: string | null;
}

const props = withDefaults(defineProps<LoginNoticeProps>(), {
	logoutReason: null,
});

defineOptions({
	inheritAttrs: false,
});

const appStore = useAppStore();

const { authenticated } = storeToRefs(appStore);

const logoutMessage = computed(() => {
	return props.logoutReason && te(`logoutReason.${props.logoutReason}`)
		? t(`logoutReason.${props.logoutReason}`)
		: t('not_authenticated');
});
</script>

<template>
	<div v-if="authenticated">
		<v-icon name="lock_open" left />
		{{ t('authenticated') }}
	</div>

	<div v-else>
		<v-icon name="lock" left />
		{{ logoutMessage }}
	</div>
</template>

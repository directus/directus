<script setup lang="ts">
import type { DirectusError } from '@directus/sdk';
import { render } from 'micromustache';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type { RequestError } from '@/api';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VError from '@/components/v-error.vue';
import { DEFAULT_REPORT_BUG_URL } from '@/constants';
import { useNotificationsStore } from '@/stores/notifications';
import { useSettingsStore } from '@/stores/settings';
import { useUserStore } from '@/stores/user';
import type { APIError } from '@/types/error';
import { Snackbar } from '@/types/notifications';

const notificationsStore = useNotificationsStore();
const { isAdmin, currentUser } = useUserStore();
const { settings } = storeToRefs(useSettingsStore());
const { t } = useI18n();
const router = useRouter();

const notifications = computed(() => notificationsStore.dialogs);

function getErrorUrl(error: undefined | Error) {
	if (!settings.value?.report_error_url) {
		return DEFAULT_REPORT_BUG_URL;
	}

	const route = useRoute();

	const renderScope = {
		error: {
			name: error?.name,
			message: error?.message,
		},
		route: {
			fullPath: route.fullPath,
			hash: route.hash,
			name: route.name,
			path: route.path,
			query: route.query,
		},
		navigator: {
			language: navigator.language,
			userAgent: navigator.userAgent,
		},
		user: {},
		role: {},
	};

	if (currentUser !== null && 'id' in currentUser) {
		renderScope.user = {
			id: currentUser.id,
			first_name: currentUser.first_name,
			last_name: currentUser.last_name,
			title: currentUser.title,
			description: currentUser.description,
			location: currentUser.location,
			status: currentUser.status,
		};

		renderScope.role = {
			id: currentUser.role?.id,
			name: currentUser.role?.name,
		};
	}

	return render(settings.value.report_error_url, renderScope);
}

const done = async (notification: Snackbar) => {
	if (notification.dismissAction) {
		await notification.dismissAction();
	}

	notificationsStore.remove(notification.id);
};

function isLicenseLimitNotification(notification: Snackbar) {
	if (isAdmin !== true) return false;
	if (notification.code !== 'LIMIT_EXCEEDED') return false;

	const extensions =
		(notification.error as RequestError | undefined)?.response?.data?.errors?.[0]?.extensions ||
		(notification.error as DirectusError | undefined)?.errors?.[0]?.extensions ||
		(notification.error as APIError | undefined)?.extensions;

	return extensions?.limit_type === 'license';
}

function getNotificationTitle(notification: Snackbar) {
	if (isLicenseLimitNotification(notification)) {
		return t('license.limit_dialog.title');
	}

	return notification.title;
}

function getNotificationText(notification: Snackbar) {
	if (isLicenseLimitNotification(notification)) {
		return t('license.limit_dialog.text');
	}

	return notification.text;
}

async function managePlan(notification: Snackbar) {
	notificationsStore.remove(notification.id);
	await router.push('/settings/license');
}
</script>

<template>
	<div class="notification-dialogs">
		<VDialog v-for="notification in notifications" :key="notification.id" model-value persist>
			<VCard :class="[notification.type]">
				<VCardTitle>{{ getNotificationTitle(notification) }}</VCardTitle>
				<VCardText
					v-if="getNotificationText(notification) || (notification.error && !isLicenseLimitNotification(notification))"
					class="notification-text"
				>
					{{ getNotificationText(notification) }}

					<VError v-if="notification.error && !isLicenseLimitNotification(notification)" :error="notification.error" />
				</VCardText>
				<VCardActions>
					<VButton v-if="isLicenseLimitNotification(notification)" secondary @click="managePlan(notification)">
						{{ $t('license.manage_plan') }}
					</VButton>
					<VButton v-else-if="notification.type === 'error' && isAdmin && notification.code === 'UNKNOWN'" secondary>
						<a target="_blank" :href="getErrorUrl(notification.error)">
							{{ $t('report_error') }}
						</a>
					</VButton>
					<VButton @click="done(notification)">{{ notification.dismissText ?? $t('dismiss') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</div>
</template>

<style lang="scss" scoped>
.notification-dialogs {
	position: relative;
}

.notification-text {
	white-space: pre-line;
}

.v-error {
	margin-block-start: 0.6875rem;
}
</style>

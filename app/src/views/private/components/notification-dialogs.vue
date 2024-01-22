<script setup lang="ts">
import { useNotificationsStore } from '@/stores/notifications';
import { useSettingsStore } from '@/stores/settings';
import { useUserStore } from '@/stores/user';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { render } from 'micromustache';
import { storeToRefs } from 'pinia';

const { t } = useI18n();

const notificationsStore = useNotificationsStore();
const { isAdmin, currentUser } = useUserStore();
const { settings } = storeToRefs(useSettingsStore());

const notifications = computed(() => notificationsStore.dialogs);

function getErrorUrl(error: undefined | Error) {
	if (!settings.value?.project_feature_url) {
		return 'https://github.com/directus/directus/issues/new?template=bug_report.yml';
	}

	return render(settings.value.project_feature_url, {
		error,
		route: useRoute(),
		navigator,
		user: currentUser,
		role: currentUser?.role,
	});
}

function done(id: string) {
	notificationsStore.remove(id);
}
</script>

<template>
	<div class="notification-dialogs">
		<v-dialog v-for="notification in notifications" :key="notification.id" model-value persist>
			<v-card :class="[notification.type]">
				<v-card-title>{{ notification.title }}</v-card-title>
				<v-card-text v-if="notification.text || notification.error">
					{{ notification.text }}

					<v-error v-if="notification.error" :error="notification.error" />
				</v-card-text>
				<v-card-actions>
					<v-button v-if="notification.type === 'error' && isAdmin && notification.code === 'UNKNOWN'" secondary>
						<a target="_blank" :href="getErrorUrl(notification.error)">
							{{ t('report_error') }}
						</a>
					</v-button>
					<v-button @click="done(notification.id)">{{ t('dismiss') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<style lang="scss" scoped>
.notification-dialogs {
	position: relative;
}

.v-error {
	margin-top: 12px;
}
</style>

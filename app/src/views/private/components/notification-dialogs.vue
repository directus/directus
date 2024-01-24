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
	if (!settings.value?.project_error_url) {
		return 'https://github.com/directus/directus/issues/new?template=bug_report.yml';
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

	return render(settings.value.project_error_url, renderScope);
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

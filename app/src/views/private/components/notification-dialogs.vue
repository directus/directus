<template>
	<div class="notification-dialogs">
		<v-dialog v-for="notification in notifications" :key="notification.id" :model-value="true" persist>
			<v-card :class="[notification.type]">
				<v-card-title>{{ notification.title }}</v-card-title>
				<v-card-text v-if="notification.text || notification.error">
					{{ notification.text }}

					<v-error v-if="notification.error" :error="notification.error" />
				</v-card-text>
				<v-card-actions>
					<v-button v-if="notification.type === 'error' && admin && notification.code === 'UNKNOWN'" secondary>
						<a target="_blank" :href="getGitHubIssueLink(notification)">
							{{ t('report_error') }}
						</a>
					</v-button>
					<v-button @click="done(notification.id)">{{ t('dismiss') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed } from 'vue';
import { useNotificationsStore } from '@/stores/notifications';
import { useUserStore } from '@/stores/user';
import { Snackbar } from '@/types/notifications';
import { useProjectInfo } from '@/modules/settings/composables/use-project-info';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const { parsedInfo } = useProjectInfo();
		const notificationsStore = useNotificationsStore();
		const userStore = useUserStore();

		const notifications = computed(() => notificationsStore.dialogs);

		return { t, notifications, admin: userStore.isAdmin, done, getGitHubIssueLink };

		function getGitHubIssueLink(notification: Snackbar) {
			const debugInfo = `<!-- Please put a detailed explanation of the problem here. -->

---

### Project details
Directus Version: ${parsedInfo.value?.directus.version}
Environment: ${import.meta.env.MODE}
OS: ${parsedInfo.value?.os.type} ${parsedInfo.value?.os.version}
Node: ${parsedInfo.value?.node.version}

### Error

Title: ${notification.title || 'none'}
Message: ${notification.text || 'none'}

<details>
<summary>Stack Trace</summary>
<pre>
${JSON.stringify(notification.error, Object.getOwnPropertyNames(notification.error), 2)}
</pre>
</details>
			`;

			return `https://github.com/directus/directus/issues/new?body=${encodeURIComponent(debugInfo)}`;
		}

		function done(id: string) {
			notificationsStore.remove(id);
		}
	},
});
</script>

<style lang="scss" scoped>
.notification-dialogs {
	position: relative;
}

.v-error {
	margin-top: 12px;
}
</style>

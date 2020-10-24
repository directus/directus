<template>
	<div class="notification-dialogs">
		<v-dialog :active="true" v-for="notify in lastFour" :key="notify.id">
			<v-card :class="[notify.type]">
				<v-card-title>{{ notify.title }}</v-card-title>
				<v-card-text v-if="notify.text">
					{{ notify.text }}
				</v-card-text>
				<v-card-actions>
					<v-button secondary v-if="notify.type === 'error'">
						<a target="_blank" :href="getGitHubIssueLink(notify.id, notify)">{{ $t('report_error') }}</a>
					</v-button>
					<v-button @click="done(notify.id)">{{ $t('dismiss') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from '@vue/composition-api';
import SidebarButton from '../sidebar-button';
import NotificationItem from '../notification-item';
import { useNotificationsStore } from '@/stores/';
import router from '@/router';
import { Notification } from '@/types';
import { useProjectInfo } from '@/modules/settings/composables/use-project-info';

export default defineComponent({
	components: { SidebarButton, NotificationItem },
	setup(props) {
		const { parsedInfo } = useProjectInfo();
		const notificationsStore = useNotificationsStore();

		return { lastFour: notificationsStore.lastFourDialogs, done, getGitHubIssueLink };

		function getGitHubIssueLink(id: string, notify: Notification) {
			const debugInfo = `<!-- Please put a detailed explanation of the problem here. -->

---

### Project details
Directus Version: ${parsedInfo.value?.directus.version}
Environment: ${process.env.NODE_ENV}
OS: ${parsedInfo.value?.os.type} ${parsedInfo.value?.os.version}
Node: ${parsedInfo.value?.node.version}

### Error

Title: ${notify.title || 'none'}
Text: ${notify.text || 'none'}
			`;

			return `https://github.com/directus/next/issues/new?body=${encodeURIComponent(debugInfo)}`;
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

.v-card {
	border-left-width: 4px;
	border-left-style: solid;

	.v-error {
		margin-top: 8px;
	}

	&.info {
		border-left-color: var(--primary);
	}

	&.success {
		border-left-color: var(--success);
	}

	&.warning {
		border-left-color: var(--warning);
	}

	&.error {
		border-left-color: var(--danger);
	}
}
</style>

import { useLatencyStore } from '@/stores/latency';
import { userName } from '@/utils/user-name';
import { useSdk } from '@directus/composables';
import { readMe } from '@directus/sdk';
import { User } from '@directus/types';
import { merge } from 'lodash';
import { defineStore } from 'pinia';
import type { RouteLocationNormalized } from 'vue-router';

type ShareUser = {
	share: string;
	role: {
		id: string;
		admin_access: false;
		app_access: false;
	};
};

export const useUserStore = defineStore({
	id: 'userStore',
	state: () => ({
		currentUser: null as User | ShareUser | null,
		loading: false,
		error: null,
	}),
	getters: {
		fullName(): string | null {
			if (this.currentUser === null || 'share' in this.currentUser) return null;
			return userName(this.currentUser);
		},
		isAdmin(): boolean {
			return this.currentUser?.role?.admin_access === true || false;
		},
	},
	actions: {
		async hydrate() {
			this.loading = true;
			const sdk = useSdk();

			try {
				const fields = ['*', 'avatar.id', 'role.admin_access', 'role.app_access', 'role.id', 'role.enforce_tfa'];
				this.currentUser = await sdk.request<User | ShareUser>(readMe({ fields }));
			} catch (error: any) {
				this.error = error;
			} finally {
				this.loading = false;
			}
		},
		async dehydrate() {
			this.$reset();
		},
		async hydrateAdditionalFields(fields: string[]) {
			const sdk = useSdk();

			try {
				const data = await sdk.request<User | ShareUser>(readMe({ fields }));
				this.currentUser = merge({}, this.currentUser, data);
			} catch (error: any) {
				// Do nothing
			}
		},
		async trackPage(to: RouteLocationNormalized) {
			/**
			 * We don't want to track the full screen preview from live previews as part of the user's
			 * last page, as that'll cause a fresh login to navigate to the full screen preview where
			 * you can't navigate away from #19160
			 */
			if (to.path.endsWith('/preview')) {
				return;
			}

			const sdk = useSdk();

			const latencyStore = useLatencyStore();

			const start = performance.now();

			await sdk.request(() => ({
				path: '/users/me/track/page',
				method: 'PATCH',
				body: JSON.stringify({
					last_page: to.fullPath,
				})
			}));

			const end = performance.now();

			latencyStore.save({
				timestamp: new Date(),
				latency: end - start,
			});

			if (this.currentUser && !('share' in this.currentUser)) {
				this.currentUser.last_page = to.fullPath;
			}
		},
	},
});

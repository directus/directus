import api from '@/api';
import { useLatencyStore } from '@/stores/latency';
import { userName } from '@/utils/user-name';
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
			return this.currentUser?.role.admin_access === true || false;
		},
	},
	actions: {
		async hydrate() {
			this.loading = true;

			try {
				const fields = [
					'id',
					'language',
					'first_name',
					'last_name',
					'email',
					'last_page',
					'appearance',
					'theme_light',
					'theme_dark',
					'theme_light_overrides',
					'theme_dark_overrides',
					'tfa_secret',
					'avatar.id',
					'role.admin_access',
					'role.app_access',
					'role.id',
					'role.enforce_tfa',
				];

				const { data } = await api.get(`/users/me`, { params: { fields } });

				this.currentUser = data.data;
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
			try {
				const { data } = await api.get(`/users/me`, { params: { fields } });

				this.currentUser = merge({}, this.currentUser, data.data);
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

			const latencyStore = useLatencyStore();

			const start = performance.now();

			await api.patch(`/users/me/track/page`, {
				last_page: to.fullPath,
			});

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

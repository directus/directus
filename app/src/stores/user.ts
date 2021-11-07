import api from '@/api';
import { useLatencyStore } from '@/stores';
import { User } from '@directus/shared/types';
import { userName } from '@/utils/user-name';
import { defineStore } from 'pinia';

export const useUserStore = defineStore({
	id: 'userStore',
	state: () => ({
		currentUser: null as User | null,
		cachedFilterContext: {} as Record<string, any>,
		loading: false,
		error: null,
	}),
	getters: {
		fullName(): string | null {
			if (this.currentUser === null) return null;
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
				const { data } = await api.get(`/users/me`, {
					params: {
						fields: '*,avatar.id,role.*',
					},
				});

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
		async trackPage(page: string) {
			const latencyStore = useLatencyStore();

			const start = performance.now();

			await api.patch(`/users/me/track/page`, {
				last_page: page,
			});

			const end = performance.now();

			latencyStore.save({
				timestamp: new Date(),
				latency: end - start,
			});

			if (this.currentUser) {
				this.currentUser.last_page = page;
			}
		},
		async updateFilterContext(requiredPermissionData: Record<string, string[]>) {
			if (!this.currentUser) return {};

			if (requiredPermissionData.$CURRENT_USER.length > 0) {
				const { data } = await api.get(`/users/me`, {
					params: {
						fields: requiredPermissionData.$CURRENT_USER.join(','),
					},
				});

				this.cachedFilterContext.$CURRENT_USER = data.data;
			}

			if (requiredPermissionData.$CURRENT_ROLE.length > 0) {
				const { data } = await api.get(`/users/me`, {
					params: {
						fields: requiredPermissionData.$CURRENT_ROLE.join(','),
					},
				});

				this.cachedFilterContext.$CURRENT_ROLE = data.data.role ?? {};
			}
		},
	},
});

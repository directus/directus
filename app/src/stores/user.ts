import { isIn } from '@directus/utils';
import { merge } from 'lodash';
import { defineStore } from 'pinia';
import { computed, ref, unref, watch } from 'vue';
import type { RouteLocationNormalized } from 'vue-router';
import api, { RequestConfig } from '@/api';
import { RTL_LANGUAGES } from '@/constants/text-direction';
import { setLanguage } from '@/lang/set-language';
import sdk from '@/sdk';
import { useServerStore } from '@/stores/server';
import { AppUser, ShareUser } from '@/types/user';
import { userName } from '@/utils/user-name';

export const useUserStore = defineStore('userStore', () => {
	const serverStore = useServerStore();

	const currentUser = ref<AppUser | ShareUser | null>(null);
	const loading = ref(false);
	const error = ref(null);

	const fullName = computed(() => {
		const user = unref(currentUser);
		if (user === null || 'share' in user) return null;
		return userName(user);
	});

	const isAdmin = computed(() => unref(currentUser)?.admin_access === true || false);

	const language = computed(() => {
		const user = unref(currentUser);

		if (user && 'language' in user && user.language !== null) {
			return user.language;
		}

		if (serverStore.info?.project?.default_language) {
			return serverStore.info.project.default_language;
		}

		return 'en-US';
	});

	watch(language, (newLang, oldLang) => {
		if (newLang && newLang !== oldLang) {
			setLanguage(newLang);
		}
	});

	const textDirection = computed(() => {
		const user = unref(currentUser);
		const lang = unref(language);

		const savedDir = (user && 'text_direction' in user && user.text_direction) ?? 'auto';

		let dir: 'ltr' | 'rtl';

		if (savedDir === 'ltr' || savedDir === 'rtl') {
			dir = savedDir;
		} else {
			dir = isIn(lang, RTL_LANGUAGES) ? 'rtl' : 'ltr';
		}

		return dir;
	});

	const hydrate = async () => {
		loading.value = true;

		try {
			const fields = ['*', 'role.id'];

			const [{ data: user }, { data: globals }, { data: roles }] = await Promise.all([
				api.get('/users/me', { params: { fields } }),
				api.get('/policies/me/globals'),
				api.get('/roles/me', { params: { fields: ['id'] } }),
			]);

			currentUser.value = {
				...user.data,
				...(user.data?.avatar != null ? { avatar: { id: user.data?.avatar } } : {}),
				...globals.data,
				roles: roles.data,
			};
		} catch (error: any) {
			error.value = error;
		} finally {
			loading.value = false;
		}
	};

	const dehydrate = async () => {
		currentUser.value = null;
		loading.value = false;
		error.value = null;
	};

	const hydrateAdditionalFields = async (fields: string[]) => {
		try {
			const { data } = await api.get('/users/me', { params: { fields } });

			currentUser.value = merge({}, unref(currentUser), data.data);
		} catch {
			// Do nothing
		}
	};

	const trackPage = async (to: RouteLocationNormalized) => {
		/**
		 * We don't want to track the full screen preview from live previews as part of the user's
		 * last page, as that'll cause a fresh login to navigate to the full screen preview where
		 * you can't navigate away from #19160
		 */
		if (to.path.endsWith('/preview')) {
			return;
		}

		await api.patch(
			'/users/me/track/page',
			{
				last_page: to.fullPath,
			},
			{ measureLatency: true } as RequestConfig,
		);

		const user = unref(currentUser);

		if (user && !('share' in user)) {
			user.last_page = to.fullPath;
		}
	};

	return {
		currentUser,
		loading,
		error,
		fullName,
		isAdmin,
		language,
		textDirection,
		hydrate,
		dehydrate,
		hydrateAdditionalFields,
		trackPage,
	};
});

import api from '@/api';
import { logout } from '@/auth';
import { useUserStore } from '@/stores/user';
import { useLocalStorage } from '@vueuse/core';
import { nanoid } from 'nanoid';
import qrcode from 'qrcode';
import { onMounted, ref } from 'vue';

export function useTFASetup(initialEnabled: boolean) {
	const loading = ref(false);
	const password = ref('');
	const tfaEnabled = ref(initialEnabled);
	const tfaGenerated = ref(false);
	const secret = ref<string>();
	const otp = ref('');
	const error = ref<any>();
	const canvasID = nanoid();

	const userStore = useUserStore();
	const requireTfaSetup = useLocalStorage<string | null>('directus-require_tfa_setup', null);

	onMounted(() => {
		password.value = '';
	});

	return {
		generateTFA,
		enableTFA,
		disableTFA,
		adminDisableTFA,
		requestTFASetup,
		cancelTFASetup,
		loading,
		password,
		tfaEnabled,
		tfaGenerated,
		secret,
		otp,
		error,
		canvasID,
		requireTfaSetup,
	};

	async function generateTFA(requiresPassword: boolean = true) {
		if (loading.value === true) return;

		loading.value = true;

		try {
			const payload = requiresPassword ? { password: password.value } : {};
			const response = await api.post('/users/me/tfa/generate', payload);
			const url = response.data.data.otpauth_url;
			secret.value = response.data.data.secret;
			await qrcode.toCanvas(document.getElementById(canvasID), url);
			tfaGenerated.value = true;
			error.value = null;
		} catch (err: any) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}

	async function enableTFA() {
		if (loading.value === true) return;

		loading.value = true;

		let success = false;

		try {
			const payload = { otp: otp.value, secret: secret.value };

			await api.post('/users/me/tfa/enable', payload);
			success = true;
			tfaEnabled.value = true;
			tfaGenerated.value = false;
			password.value = '';
			otp.value = '';
			secret.value = '';
			error.value = null;
			requireTfaSetup.value = null;
			await userStore.hydrate();
		} catch (err: any) {
			error.value = err;
		} finally {
			loading.value = false;
		}

		return success;
	}

	async function disableTFA() {
		loading.value = true;
		let success = false;

		try {
			await api.post('/users/me/tfa/disable', { otp: otp.value });
			success = true;
			await userStore.hydrate();
			tfaEnabled.value = false;
			otp.value = '';
			error.value = null;
			requireTfaSetup.value = null;
		} catch (err: any) {
			error.value = err;
		} finally {
			loading.value = false;
		}

		return success;
	}

	async function adminDisableTFA(pk: string) {
		loading.value = true;
		let success = false;

		try {
			await api.post(`/users/${pk}/tfa/disable`);
			success = true;
			tfaEnabled.value = false;
			otp.value = '';
			error.value = null;
			const currentUser = userStore.currentUser;

			if (currentUser && !('share' in currentUser) && currentUser.id === pk) {
				requireTfaSetup.value = null;
			}
		} catch (err: any) {
			error.value = err;
		} finally {
			loading.value = false;
		}

		return success;
	}

	async function requestTFASetup() {
		if (loading.value === true) return;

		loading.value = true;

		let success = false;

		try {
			const currentUser = userStore.currentUser;
			requireTfaSetup.value = currentUser && !('share' in currentUser) ? currentUser.id : null;
			success = true;
			error.value = null;
			await logout();
		} catch (err: any) {
			error.value = err;
		} finally {
			loading.value = false;
		}

		return success;
	}

	async function cancelTFASetup() {
		if (loading.value === true) return;

		loading.value = true;

		let success = false;

		try {
			requireTfaSetup.value = null;
			success = true;
			error.value = null;
			await userStore.hydrate();
		} catch (err: any) {
			error.value = err;
		} finally {
			loading.value = false;
		}

		return success;
	}
}

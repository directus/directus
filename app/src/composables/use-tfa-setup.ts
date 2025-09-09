import api from '@/api';
import { logout } from '@/auth';
import { nanoid } from 'nanoid';
import { onMounted, ref } from 'vue';
import qrcode from 'qrcode';
import { useUserStore } from '@/stores/user';

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

	onMounted(() => {
		password.value = '';
	});

	return {
		generateTFA,
		enableTFA,
		disableTFA,
		adminDisableTFA,
		request2FASetup,
		cancel2FASetup,
		loading,
		password,
		tfaEnabled,
		tfaGenerated,
		secret,
		otp,
		error,
		canvasID,
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

	async function enableTFA(requiresPassword: boolean = true) {
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
		} catch (err: any) {
			error.value = err;
		} finally {
			loading.value = false;
		}

		return success;
	}

	async function request2FASetup() {
		if (loading.value === true) return;

		loading.value = true;

		let success = false;

		try {
			await api.post('/users/me/tfa/request-setup');
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

	async function cancel2FASetup() {
		if (loading.value === true) return;

		loading.value = true;

		let success = false;

		try {
			await api.post('/users/me/tfa/cancel-setup');
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

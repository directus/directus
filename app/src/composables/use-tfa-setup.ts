import api from '@/api';
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
		loading,
		password,
		tfaEnabled,
		tfaGenerated,
		secret,
		otp,
		error,
		canvasID,
	};

	async function generateTFA() {
		if (loading.value === true) return;

		loading.value = true;

		try {
			const response = await api.post('/users/me/tfa/generate', { password: password.value });
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
			await api.post('/users/me/tfa/enable', { otp: otp.value, secret: secret.value });
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
}

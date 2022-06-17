import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { notify } from '@/utils/notify';

type Message = {
	success?: string;
	fail?: string;
};

export default function useClipboard() {
	const { t } = useI18n();

	const isCopySupported = computed(() => {
		return !!navigator?.clipboard?.writeText;
	});

	const isPasteSupported = computed(() => {
		return !!navigator?.clipboard?.readText;
	});

	return { isCopySupported, isPasteSupported, copyToClipboard, pasteFromClipboard };

	async function copyToClipboard(value: string, message?: Message): Promise<boolean> {
		try {
			await navigator?.clipboard?.writeText(value);
			notify({
				title: message?.success ?? t('copy_raw_value_success'),
			});
			return true;
		} catch (err: any) {
			notify({
				type: 'error',
				title: message?.fail ?? t('copy_raw_value_fail'),
			});
			return false;
		}
	}

	async function pasteFromClipboard(message?: Message): Promise<string | null> {
		try {
			const pasteValue = await navigator?.clipboard?.readText();
			notify({
				title: message?.success ?? t('paste_raw_value_success'),
			});
			return pasteValue;
		} catch (err: any) {
			notify({
				type: 'error',
				title: message?.fail ?? t('paste_raw_value_fail'),
			});
			return null;
		}
	}
}

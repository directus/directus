import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { notify } from '@/utils/notify';

type Message = {
	success?: string;
	fail?: string;
};

export function useClipboard() {
	const { t } = useI18n();

	const isCopySupported = computed(() => {
		return !!navigator?.clipboard?.writeText;
	});

	const isPasteSupported = computed(() => {
		return !!navigator?.clipboard?.readText;
	});

	return { isCopySupported, isPasteSupported, copyToClipboard, pasteFromClipboard };

	async function copyToClipboard(value: any, message?: Message): Promise<boolean> {
		try {
			const valueString = typeof value === 'string' ? value : JSON.stringify(value);
			await navigator.clipboard.writeText(valueString);

			notify({
				title: message?.success ?? t('copy_raw_value_success'),
			});

			return true;
		} catch {
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
		} catch {
			notify({
				type: 'error',
				title: message?.fail ?? t('paste_raw_value_fail'),
			});

			return null;
		}
	}
}

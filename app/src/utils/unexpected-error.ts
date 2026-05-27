import { i18n } from '@/lang';
import { useNotificationsStore } from '@/stores/notifications';
import { extractErrorCode } from '@/utils/extract-error-code';

let store: any;

export function unexpectedError(error: unknown): void {
	if (!store) store = useNotificationsStore();

	const code = extractErrorCode(error);

	// eslint-disable-next-line no-console
	console.warn(error);

	store.add({
		title: i18n.global.t(`errors.${code}`),
		type: 'error',
		code,
		dialog: true,
		error,
	});
}

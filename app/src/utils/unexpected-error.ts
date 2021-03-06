import { useNotificationsStore } from '@/stores/';
import { i18n } from '@/lang';
import { RequestError } from '@/api';

let store: any;

export function unexpectedError(error: Error | RequestError) {
	if (!store) store = useNotificationsStore();

	const code = (error as RequestError).response?.data?.errors?.[0]?.extensions?.code || 'UNKNOWN';
	const message = (error as RequestError).response?.data?.errors?.[0]?.message || error.message || undefined;

	console.warn(error);

	store.add({
		title: i18n.t(`errors.${code}`),
		text: message,
		type: 'error',
		dialog: true,
		error,
	});
}

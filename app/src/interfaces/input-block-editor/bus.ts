import { useEventBus } from '@vueuse/core';

type Event = {
	type: 'open-url';
	payload: string;
};

export function useBus() {
	const bus = useEventBus<Event>('editorjs');

	return bus;
}

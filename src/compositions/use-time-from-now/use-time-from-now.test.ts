import { Ref } from '@vue/composition-api';
import useTimeFromNow from './use-time-from-now';
import mountComposition from '../../../.jest/mount-composition';
import mockdate from 'mockdate';

describe('Compositions / Event Listener', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		mockdate.reset();
	});

	it('Formats the date relative', () => {
		const now = new Date();
		let timeAgo: Ref<string>;
		let timeAhead: Ref<string>;

		mountComposition(() => {
			timeAgo = useTimeFromNow(new Date(now.getTime() - 5 * 60 * 1000));
			timeAhead = useTimeFromNow(new Date(now.getTime() + 5 * 60 * 1000));
		});

		expect(timeAgo!.value).toBe('5 minutes ago');
		expect(timeAhead!.value).toBe('in 5 minutes');
	});

	it('Updates the ref every minute by default', () => {
		mockdate.set('2020-01-01T12:00:00');
		const now = new Date();

		const component = mountComposition(() => {
			const timeAgo = useTimeFromNow(new Date(now.getTime() - 5 * 60 * 1000));
			return { timeAgo };
		});

		expect((component.vm as any).timeAgo).toBe('5 minutes ago');

		mockdate.set('2020-01-01T12:01:00');
		jest.runTimersToTime(60000);

		expect(setInterval).toHaveBeenCalledTimes(1);

		expect((component.vm as any).timeAgo).toBe('6 minutes ago');
	});

	it('Does not automatically update if 0 is passed for autoUpdate param', () => {
		mockdate.set('2020-01-01T12:00:00');
		const now = new Date();

		const component = mountComposition(() => {
			const timeAgo = useTimeFromNow(new Date(now.getTime() - 5 * 60 * 1000), 0);
			return { timeAgo };
		});

		expect((component.vm as any).timeAgo).toBe('5 minutes ago');

		mockdate.set('2020-01-01T12:01:00');
		jest.runTimersToTime(60000);

		expect(setInterval).toHaveBeenCalledTimes(0);

		expect((component.vm as any).timeAgo).toBe('5 minutes ago');
	});

	it('Clears the interval when the component is unmounted', () => {
		mockdate.set('2020-01-01T12:00:00');
		const now = new Date();

		const component = mountComposition(() => {
			const timeAgo = useTimeFromNow(new Date(now.getTime() - 5 * 60 * 1000));
			return { timeAgo };
		});

		expect((component.vm as any).timeAgo).toBe('5 minutes ago');

		mockdate.set('2020-01-01T12:01:00');
		jest.runTimersToTime(60000);

		expect(setInterval).toHaveBeenCalledTimes(1);

		component.destroy();

		mockdate.set('2020-01-01T12:01:00');
		jest.runTimersToTime(60000);

		expect(setInterval).toHaveBeenCalledTimes(1);
	});
});

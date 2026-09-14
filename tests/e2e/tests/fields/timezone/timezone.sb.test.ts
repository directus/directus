import { type sandbox as Sandbox, sandbox } from '@directus/sandbox';
import { createCollection, createDirectus, createItems, readItem, readItems, rest, staticToken, updateField, updateItem } from '@directus/sdk'; // prettier-ignore
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const COLLECTION = 'timezone_items';

/** The server's own timezone must not leak into what is stored or returned. */
const TIMEZONES = ['UTC', 'America/Sao_Paulo', 'Asia/Seoul'];

type Sample = { date: string; time: string; datetime: string; timestamp: string };

/** Every hour of the day, in three shapes, with three different timestamp offsets. */
const SAMPLES: Sample[] = Array.from({ length: 24 }).flatMap((_, hour) => {
	const hh = String(hour).padStart(2, '0');

	return [
		{ date: '2022-01-05', time: `${hh}:11:11`, datetime: `2022-01-05T${hh}:11:11`, timestamp: `2022-01-05T${hh}:11:11-01:00` }, // prettier-ignore
		{
			date: '2022-01-10',
			time: `${hh}:22:22`,
			datetime: `2022-01-10T${hh}:22:22`,
			timestamp: `2022-01-10T${hh}:22:22Z`,
		},
		{ date: '2022-01-15', time: `${hh}:33:33`, datetime: `2022-01-15T${hh}:33:33`, timestamp: `2022-01-15T${hh}:33:33+02:00` }, // prettier-ignore
	];
});

const isOracle = database === 'oracle';

/** How far `timeZone` is ahead of UTC at `date`, in milliseconds. */
function offsetOf(timeZone: string, date: Date) {
	const parts = Object.fromEntries(
		new Intl.DateTimeFormat('en-US', {
			timeZone,
			hour12: false,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		})
			.formatToParts(date)
			.map((part) => [part.type, Number(part.value)]),
	);

	const wallClock = Date.UTC(parts['year']!, parts['month']! - 1, parts['day']!, parts['hour']! % 24, parts['minute']!, parts['second']!); // prettier-ignore

	return wallClock - date.getTime();
}

/**
 * Turns a stamp the API returned into an instant. Databases that keep no offset hand back a
 * naive wall clock in the server's own timezone, which only means something once that is undone.
 */
function instantOf(stamp: string, timeZone: string) {
	if (/(?:Z|[+-]\d{2}:?\d{2})$/.test(stamp)) return new Date(stamp).getTime();

	const asIfUtc = Date.parse(`${stamp}Z`);

	return asIfUtc - offsetOf(timeZone, new Date(asIfUtc));
}

for (const timezone of TIMEZONES) {
	describe(`a server running in ${timezone}`, () => {
		let directus: Awaited<ReturnType<typeof Sandbox>>;
		let api: ReturnType<typeof createDirectus<any>> & any;

		beforeAll(async () => {
			directus = await sandbox(database, {
				port: sandboxPort(TIMEZONES.indexOf(timezone)),
				inspect: false,
				prefix: `tz-${timezone}`,
				env: {
					TZ: timezone,
					DB_FILENAME: `directus_test_${getUID()}_${timezone.replaceAll('/', '_')}.db`,
				},
				docker: { suffix: `${getUID()}${timezone.replaceAll('/', '')}` },
			});

			api = createDirectus<any>(`http://localhost:${directus.apis[0]!.port}`).with(rest()).with(staticToken('admin'));

			await api.request(
				createCollection({
					collection: COLLECTION,
					fields: [
						{
							field: 'id',
							type: 'integer',
							meta: { hidden: true, interface: 'input', readonly: true },
							schema: { is_primary_key: true, has_auto_increment: true },
						},
						{ field: 'date', type: 'date', meta: {}, schema: {} },
						// Oracle has no time only type
						...(isOracle ? [] : [{ field: 'time', type: 'time', meta: {}, schema: {} }]),
						{ field: 'datetime', type: 'dateTime', meta: {}, schema: {} },
						{ field: 'timestamp', type: 'timestamp', meta: {}, schema: {} },
						{ field: 'date_created', type: 'timestamp', meta: {}, schema: {} },
						{ field: 'date_updated', type: 'timestamp', meta: {}, schema: {} },
					],
					schema: {},
					meta: { singleton: false },
				} as any),
			);

			await api.request(updateField(COLLECTION, 'date_created', { meta: { special: ['date-created'] } } as any));
			await api.request(updateField(COLLECTION, 'date_updated', { meta: { special: ['date-updated'] } } as any));
		}, 120_000);

		afterAll(async () => {
			await directus.stop();
		});

		test('stores and returns every value in the timezone it was given in', async () => {
			const payload = SAMPLES.map((sample) => (isOracle ? { ...sample, time: undefined } : sample));

			const before = Date.now();
			await api.request(createItems(COLLECTION, payload as any));
			const after = Date.now();

			const items = await api.request(readItems(COLLECTION, { fields: ['*'], limit: -1, sort: ['id'] } as any));

			expect(items).toHaveLength(SAMPLES.length);

			for (const [index, item] of items.entries()) {
				const sample = SAMPLES[index]!;

				expect(item.date).toBe(sample.date);
				expect(item.datetime).toBe(sample.datetime);

				if (!isOracle) expect(item.time).toBe(sample.time);

				// A timestamp is normalized to UTC, keeping the instant it referred to
				expect(item.timestamp.substring(0, 19)).toBe(new Date(sample.timestamp).toISOString().substring(0, 19));

				const created = instantOf(item.date_created, timezone);

				expect(created).toBeGreaterThanOrEqual(before - 1000);
				expect(created).toBeLessThanOrEqual(after + 1000);

				expect(item.date_updated).toBeNull();
			}
		});

		test('stamps date_updated in the same timezone on update', async () => {
			const [item] = await api.request(readItems(COLLECTION, { fields: ['id'], limit: 1, sort: ['id'] } as any));

			// A second apart, so the update stamp is distinguishable from the create stamp
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const before = Date.now();
			await api.request(updateItem(COLLECTION, item.id, { date: SAMPLES[0]!.date } as any));
			const after = Date.now();

			const updated = await api.request(readItem(COLLECTION, item.id, { fields: ['*'] } as any));

			expect(updated.date).toBe(SAMPLES[0]!.date);
			expect(updated.date_created).not.toBeNull();
			expect(updated.date_updated).not.toBeNull();
			expect(updated.date_updated).not.toBe(updated.date_created);

			const stamp = instantOf(updated.date_updated, timezone);

			expect(stamp).toBeGreaterThanOrEqual(before - 1000);
			expect(stamp).toBeLessThanOrEqual(after + 1000);
		});
	});
}

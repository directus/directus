/* eslint-disable no-console */
import { v4 as uuid } from 'uuid';
import { music, internet, name, datatype, lorem, address } from 'faker';
import { Knex } from 'knex';

type Guest = {
	id?: string;
	name: string;
	birthday: Date;
	search_radius: string;
	earliest_events_to_show: string;
	latest_events_to_show: string;
	password: string;
	shows_attended: number;
	favorite_artist?: number;
};

type Artist = {
	id?: number;
	name: string;
	members: string;
};

type Tour = {
	id?: number;
	route: string;
	map_of_stops: string;
	area_of_reach: string;
	revenue_estimated: bigint;
};

type Organizer = {
	id?: number;
	name: string;
};

type Event = {
	id?: number;
	time: Date;
	description: string;
	cost: number;
	location: string;
	created_at: Date;
	tags: string;
};

type JoinTable = {
	id?: string;
	[key: string]: any;
};

type Item = Guest | Artist | Tour | Organizer | Event | JoinTable;

/*
 * Options Example: Artist
 * Select: ['name', 'members']
 * Where: ['id', 3]
 */

type SeedOptions = {
	select: string[];
	where: any[];
};

export type JoinTableOptions = {
	[key: string]: string | number;
};

export const seedTable = async function (
	database: Knex<any, unknown>,
	count: number,
	table: string,
	factory: Item | (() => Item),
	options?: SeedOptions
): Promise<void | any[]> {
	const row: Record<string, number> = {};
	if (typeof factory === 'object') {
		await database(table).insert(factory);
		row[table] = row[table]! + 1;
	} else if (count >= 262) {
		try {
			let fakeRows: any[] = [];
			for (let i = 0; i < count; i++) {
				fakeRows.push(factory());
				if (i % 262 === 0) {
					await database.batchInsert(table, fakeRows, 262);
					fakeRows = [];
				}
				row[table] = row[table]! + 1;
			}
			if (count - row[table]! < 262) {
				await database.batchInsert(table, fakeRows, 262);
				fakeRows = [];
			}
		} catch (error: any) {
			throw new Error(error);
		}
	} else {
		try {
			const fakeRows = [];
			for (let i = 0; i < count; i++) {
				fakeRows.push(factory());
				console.log(`${i} ${table}`);
				row[table] = row[table]! + 1;
			}
			await database(table).insert(fakeRows);
		} catch (error: any) {
			throw new Error(error);
		}
	}
	if (options) {
		const { select, where } = options;
		return await database(table).select(select).where(where[0], where[1]);
	}
};

export const createArtist = (): Artist => ({
	name: internet.userName(),
	members: JSON.stringify({ role: internet.userName }),
});

export const createEvent = (): Event => ({
	cost: datatype.float(),
	description: lorem.paragraphs(2),
	location: getRandomGeoPoint(),
	created_at: randomDateTime(new Date(1030436120350), new Date(1633466120350)),
	time: randomDateTime(new Date(1030436120350), new Date(1633466120350)),
	tags: `tags
${music.genre}
${music.genre}
${music.genre}
`,
});

export const createTour = (): Tour => ({
	route: getRandomGeoLineString(),
	map_of_stops: 'string',
	area_of_reach: getRandomGeoPolygon(),
	revenue_estimated: BigInt(getRandomInt(Number.MAX_SAFE_INTEGER)),
});

export const createGuest = (): Guest => ({
	id: uuid(),
	birthday: randomDateTime(new Date(1030436120350), new Date(1633466120350)),
	name: `${name.firstName()} ${name.lastName()}`,
	search_radius: 'string',
	earliest_events_to_show: randomTime(),
	latest_events_to_show: randomTime(),
	password: 'string',
	shows_attended: datatype.number(),
});

export const createJoinTable = (options: Record<string, string | number>[]): JoinTable => {
	const row: Record<string, string | number> = {};
	options.forEach((column) => {
		for (const [columnName, value] of Object.entries(column)) {
			row[columnName] = value;
		}
	});
	return row;
};

function getRandomInt(max: number) {
	return Math.floor(Math.random() * max);
}

function randomDateTime(start: Date, end: Date) {
	return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomTime() {
	const dateTime = randomDateTime(new Date(1030436120350), new Date(1633466120350)).toUTCString();
	return dateTime.substring(17, 25);
}

function getRandomGeoPoint() {
	const location = address.nearbyGPSCoordinate();
	return `POINT(${location[0]} ${location[1]})`;
}
function getRandomGeoLineString() {
	const location = address.nearbyGPSCoordinate();
	const location2 = address.nearbyGPSCoordinate();

	return `LINESTRING(${location[0]} ${location[1]},${location2[0]} ${location2[1]})`;
}

function getRandomGeoPolygon() {
	const location = address.nearbyGPSCoordinate();
	const location2 = address.nearbyGPSCoordinate();
	const location3 = address.nearbyGPSCoordinate();
	const location4 = address.nearbyGPSCoordinate();
	const location5 = address.nearbyGPSCoordinate();

	return `POLYGON((${location[0]} ${location[1]},${location2[0]} ${location2[1]},${location3[0]} ${location3[1]},${location4[0]} ${location4[1]},${location5[0]} ${location5[1]}))`;
}

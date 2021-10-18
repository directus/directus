import { v4 as uuid } from 'uuid';
import { music, internet, name, finance, random, datatype, lorem, address } from 'faker';
import { Knex } from 'knex';

type Guest = {
	id?: number;
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
	id: string;
	route: string;
	map_of_stops: string;
	area_of_reach: string;
	revenue_estimated: bigint;
};

type Organizer = {
	id: string;
	name: string;
};

type Event = {
	id: string;
	time: Date;
	description: string;
	cost: number;
	location: string;
	created_at: Date;
	tags: string;
};

type JoinTable = {
	id: string;
	[key: string]: any;
};

type Item = Guest | Artist | Tour | Organizer | Event | JoinTable;

export const seedTable = async function (
	knex: Knex<any, unknown>,
	count: number,
	table: string,
	factory: Item | (() => Item)
): Promise<void> {
	if (typeof factory === 'object') {
		await knex(table).insert(factory);
	} else {
		const fakeRow = [];
		for (let i = 0; i < count; i++) {
			fakeRow.push(factory());
		}
		await knex(table).insert(fakeRow);
	}
};

export const createArtist = (): Artist => ({
	name: internet.userName(),
	members: JSON.stringify({ role: internet.userName }),
});

export const createEvent = (): Event => ({
	id: uuid(),
	cost: random.float(),
	description: lorem.paragraphs(2),
	location: address.streetAddress(),
	created_at: randomDateTime(new Date(1030436120350), new Date(1633466120350)),
	time: randomDateTime(new Date(1030436120350), new Date(1633466120350)),
	tags: `tags
${music.genre}
${music.genre}
${music.genre}
`,
});

export const createTour = (): Tour => ({
	id: uuid(),
	route: 'string',
	map_of_stops: 'string',
	area_of_reach: 'string',
	revenue_estimated: BigInt(finance.amount(Number.MAX_SAFE_INTEGER)),
});

export const createGuest = (): Guest => ({
	birthday: randomDateTime(new Date(1030436120350), new Date(1633466120350)),
	name: `${name.firstName()} ${name.lastName()}`,
	search_radius: 'string',
	earliest_events_to_show: randomTime(),
	latest_events_to_show: randomTime(),
	password: 'string',
	shows_attended: datatype.number(),
});

export const createMany = (factory: () => Item, count: number) => {
	const items: Item[] = [];
	for (let rows = 0; rows < count; rows++) {
		items.push(factory());
	}
	return items;
};

function randomDateTime(start: Date, end: Date) {
	return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomTime() {
	const dateTime = randomDateTime(new Date(1030436120350), new Date(1633466120350)).toUTCString();
	return dateTime.substring(17, 25);
}

import { Knex } from 'knex';

interface IDateTimeHelper {
	year(column: string): Knex.Raw;
	month(column: string): Knex.Raw;
	week(column: string): Knex.Raw;
	day(column: string): Knex.Raw;
	weekday(column: string): Knex.Raw;
	hour(column: string): Knex.Raw;
	minute(column: string): Knex.Raw;
	second(column: string): Knex.Raw;
}

class DateTimeHelper implements IDateTimeHelper {
	protected knex: Knex;

	constructor(knex: Knex) {
		this.knex = knex;
	}

	year(column: string): Knex.Raw {
		throw new Error(`Method "year" not implemented for dialect ${this.knex.client.constructor.name}`);
	}

	month(column: string): Knex.Raw {
		throw new Error(`Method "month" not implemented for dialect ${this.knex.client.constructor.name}`);
	}

	week(column: string): Knex.Raw {
		throw new Error(`Method "week" not implemented for dialect ${this.knex.client.constructor.name}`);
	}

	day(column: string): Knex.Raw {
		throw new Error(`Method "date" not implemented for dialect ${this.knex.client.constructor.name}`);
	}

	weekday(column: string): Knex.Raw {
		throw new Error(`Method "weekday" not implemented for dialect ${this.knex.client.constructor.name}`);
	}

	hour(column: string): Knex.Raw {
		throw new Error(`Method "hour" not implemented for dialect ${this.knex.client.constructor.name}`);
	}

	minute(column: string): Knex.Raw {
		throw new Error(`Method "minute" not implemented for dialect ${this.knex.client.constructor.name}`);
	}

	second(column: string): Knex.Raw {
		throw new Error(`Method "second" not implemented for dialect ${this.knex.client.constructor.name}`);
	}
}

export class DateTimeHelperPostgres extends DateTimeHelper {
	constructor(knex: Knex) {
		super(knex);
	}

	year(column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(YEAR FROM ??) as ??', [column, `${column}_year`]);
	}

	month(column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(MONTH FROM ??)', [column]);
	}

	week(column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(WEEK FROM ??)', [column]);
	}

	day(column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(DAY FROM ??)', [column]);
	}

	weekday(column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(DOW FROM ??)', [column]);
	}

	hour(column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(HOUR FROM ??)', [column]);
	}

	minute(column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(MINUTE FROM ??)', [column]);
	}

	second(column: string): Knex.Raw {
		return this.knex.raw('EXTRACT(SECOND FROM ??)', [column]);
	}
}

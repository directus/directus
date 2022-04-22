import { DateHelper } from '../types';

export class DateHelperSQLite extends DateHelper {
	parse(date: string): string {
		const newDate = new Date(date);
		return (newDate.getTime() - newDate.getTimezoneOffset() * 60 * 1000).toString();
	}

	fieldFlagForField(fieldType: string): string {
		switch (fieldType) {
			case 'timestamp':
				return 'cast-timestamp';
			default:
				return '';
		}
	}
}

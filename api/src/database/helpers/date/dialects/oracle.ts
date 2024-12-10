import { DateHelper } from '../types.js';

export class DateHelperOracle extends DateHelper {
	// Oracle does not support decimal with Z date/timestamp fields and requires format: 2024-12-08 14:27:00
	override parse(date: string | Date): string {
		if (!date) {
			return date;
		}

		if (date instanceof Date) {
			return String(date.toISOString().substring(0, 19));
		}

		return String(new Date(date).toISOString().substring(0, 19));
	}

	override fieldFlagForField(fieldType: string): string {
		switch (fieldType) {
			case 'dateTime':
				return 'cast-datetime';
			default:
				return '';
		}
	}
}

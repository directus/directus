import { DateHelper } from '../types.js';

export class DateHelperOracle extends DateHelper {
	override fieldFlagForField(fieldType: string): string {
		switch (fieldType) {
			case 'dateTime':
				return 'cast-datetime';
			default:
				return '';
		}
	}
}

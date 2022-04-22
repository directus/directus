import { DateHelper } from '../types';

export class DateHelperOracle extends DateHelper {
	fieldFlagForField(fieldType: string): string {
		switch (fieldType) {
			case 'dateTime':
				return 'cast-datetime';
			default:
				return '';
		}
	}
}

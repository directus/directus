import { DateHelper } from '../types';

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

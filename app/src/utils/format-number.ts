/**
 * Formats a number using Intl.NumberFormat
 *
 * @param value - The value you are formatting
 * @param locales - BCP 47 language tag, or an array of such strings.
 * @param options - Intl.NumberFormat options
 *
 * @example
 * ```js
 * formatNumber(123456.789, 'en-US', { style: 'currency', currency: 'USD' });
 * ```
 */

const SIMPLE_UNITS = [
	'acre',
	'bit',
	'byte',
	'celsius',
	'centimeter',
	'day',
	'degree',
	'fahrenheit',
	'fluid-ounce',
	'foot',
	'gallon',
	'gigabit',
	'gigabyte',
	'gram',
	'hectare',
	'hour',
	'inch',
	'kilobit',
	'kilobyte',
	'kilogram',
	'kilometer',
	'liter',
	'megabit',
	'megabyte',
	'meter',
	'mile',
	'mile-scandinavian',
	'millimeter',
	'milliliter',
	'millisecond',
	'minute',
	'month',
	'ounce',
	'percent',
	'petabyte',
	'pound',
	'second',
	'stone',
	'terabit',
	'terabyte',
	'week',
	'yard',
	'year',
] as const;

export type SimpleUnit = (typeof SIMPLE_UNITS)[number];

export type Unit = SimpleUnit | `${SimpleUnit}-per-${SimpleUnit}`; // Compound unit type

export type Notation = 'standard' | 'scientific' | 'engineering' | 'compact';

export type SignDisplay = 'auto' | 'never' | 'always' | 'exceptZero';

export type RoundingMode =
	| 'ceil'
	| 'floor'
	| 'expand'
	| 'trunc'
	| 'halfCeil'
	| 'halfFloor'
	| 'halfExpand'
	| 'halfTrunc'
	| 'halfEven';

export type CurrencyDisplay = 'symbol' | 'code' | 'name' | 'narrowSymbol';

export type CurrencySign = 'standard' | 'accounting';

export type UnitDisplay = 'long' | 'short' | 'narrow';

export type LocaleMatcher = 'lookup' | 'best fit';

export type Style = 'decimal' | 'currency' | 'percent' | 'unit';

interface BaseNumberFormatOptions {
	style?: Style;
	localeMatcher?: LocaleMatcher;
	useGrouping?: boolean;
	minimumIntegerDigits?: number; // 1..21
	minimumFractionDigits?: number; // 0..20
	maximumFractionDigits?: number; // 0..20
	minimumSignificantDigits?: number; // 1..21
	maximumSignificantDigits?: number; // 1..21
	notation?: Notation;
	signDisplay?: SignDisplay;
	roundingMode?: RoundingMode;
	roundingIncrement?: number;
	unit?: Unit;
	currency?: string;
}

interface CurrencyOptions extends BaseNumberFormatOptions {
	style: 'currency';
	currency: string; // ISO 4217 currency code (e.g., 'USD', 'EUR', 'JPY')
	currencyDisplay?: CurrencyDisplay;
	currencySign?: CurrencySign;
}

interface UnitOptions extends BaseNumberFormatOptions {
	style: 'unit';
	unit: Unit;
	unitDisplay?: UnitDisplay;
}

export type NumberFormatOptions = BaseNumberFormatOptions | CurrencyOptions | UnitOptions;

function isSimpleUnit(value: any): value is SimpleUnit {
	return SIMPLE_UNITS.includes(value);
}

export function isUnit(value: any): value is Unit {
	if (!value) return false;
	if (isSimpleUnit(value)) return true;

	const parts = value.split('-per-');
	return parts.length === 2 && isSimpleUnit(parts[0]) && isSimpleUnit(parts[1]);
}

export function formatNumber(value: number, locales: string | string[], options?: NumberFormatOptions): string {
	// if the style isnt unit and unit
	if (options?.style !== 'unit' && options?.unit) {
		// if unit is not style but there is a unit prop, delete it
		delete options.unit;
	}

	if (options?.style !== 'currency' && options?.currency) {
		delete options.currency;
	}

	try {
		const formatter: Intl.NumberFormat = new Intl.NumberFormat(locales, options);
		return formatter.format(value);
	} catch (e) {
		return String(value);
	}
}

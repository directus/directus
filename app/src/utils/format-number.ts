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

export type SimpleUnit =
	| 'acre'
	| 'bit'
	| 'byte'
	| 'celsius'
	| 'centimeter'
	| 'day'
	| 'degree'
	| 'fahrenheit'
	| 'fluid-ounce'
	| 'foot'
	| 'gallon'
	| 'gigabit'
	| 'gigabyte'
	| 'gram'
	| 'hectare'
	| 'hour'
	| 'inch'
	| 'kilobit'
	| 'kilobyte'
	| 'kilogram'
	| 'kilometer'
	| 'liter'
	| 'megabit'
	| 'megabyte'
	| 'meter'
	| 'mile'
	| 'mile-scandinavian'
	| 'millimeter'
	| 'milliliter'
	| 'millisecond'
	| 'minute'
	| 'month'
	| 'ounce'
	| 'percent'
	| 'petabyte'
	| 'pound'
	| 'second'
	| 'stone'
	| 'terabit'
	| 'terabyte'
	| 'week'
	| 'yard'
	| 'year';

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
	unit? : Unit;
}

interface CurrencyOptions extends BaseNumberFormatOptions {
	style: 'currency';
	currency?: string; // ISO 4217 currency code (e.g., 'USD', 'EUR', 'JPY')
	currencyDisplay?: CurrencyDisplay;
	currencySign?: CurrencySign;
}


interface UnitOptions extends BaseNumberFormatOptions {
	style: 'unit';
	unit: Unit;
	unitDisplay?: UnitDisplay;
}

export type NumberFormatOptions = BaseNumberFormatOptions | CurrencyOptions | UnitOptions;

export function formatNumber(value: number, locales: string | string[], options?: NumberFormatOptions): string {

	if(options?.style !== 'unit' && options?.unit) {
		// delete unit if style is not unit
		delete options.unit;
	}

	const formatter: Intl.NumberFormat = new Intl.NumberFormat(locales, options);
	return formatter.format(value);
}

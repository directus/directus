type numeric = number | bigint;

// Limit of big int that can be stored in SQL databases of all flavors
const MAX_BIG_INT = BigInt(9223372036854775807n);
const MIN_BIG_INT = BigInt(-9223372036854775807n);

export class SafeInteger {
	private _value: numeric;
	private MAX_VALUE: numeric;
	private MIN_VALUE: numeric;
	private isBigInt = false;

	constructor(value: number | bigint | string, isBigInt = false) {
		if (isBigInt) {
			this._value = BigInt(value);
			this.MAX_VALUE = MAX_BIG_INT;
			this.MIN_VALUE = MIN_BIG_INT;
			this.isBigInt = true;
			return;
		}

		this._value = Number(value);
		this.MAX_VALUE = Number.MAX_SAFE_INTEGER;
		this.MIN_VALUE = Number.MIN_SAFE_INTEGER;
	}

	get isMaximum() {
		return this._value >= this.MAX_VALUE;
	}

	get isMinimum() {
		return this._value <= this.MIN_VALUE;
	}

	get isInvalid() {
		return this._value > this.MAX_VALUE || this._value < this.MIN_VALUE;
	}

	get isValid() {
		return !this.isInvalid;
	}

	get value() {
		return this.isBigInt ? this._value.toString() : this._value;
	}

	toString() {
		return this._value.toString();
	}

	setValue(value: string) {
		const newValue = this.isBigInt ? BigInt(value) : Number(value);

		if (newValue > this.MAX_VALUE || newValue < this.MIN_VALUE) {
			return false;
		}

		this._value = newValue;
		return true;
	}

	add(value: number) {
		if (this.isMaximum) {
			return;
		}

		if (typeof this._value === 'bigint') {
			this._value += BigInt(value);
			return;
		}

		this._value += value;
	}

	sub(value: number) {
		if (this.isMinimum) {
			return;
		}

		if (typeof this._value === 'bigint') {
			this._value -= BigInt(value);
			return;
		}

		this._value -= value;
	}

	increment() {
		this.add(1);
	}

	decrement() {
		this.sub(1);
	}
}

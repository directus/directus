type numeric = number | bigint;

export class SafeInteger {
	private _value: numeric;
	private MAX_VALUE: numeric;
	private MIN_VALUE: numeric;

	constructor(value: number | bigint | string, isBigInt = false) {
		if (isBigInt) {
			this._value = BigInt(value);
			this.MAX_VALUE = BigInt(9223372036854775807n);
			this.MIN_VALUE = BigInt(-9223372036854775807n);
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

	get isValid() {
		return !this.isMaximum && !this.isMinimum;
	}

	get isInvalid() {
		return !this.isValid;
	}

	get value() {
		return typeof this._value === 'bigint' ? this._value.toString() : this._value;
	}

	toString() {
		return this._value.toString();
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

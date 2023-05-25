export class Vector2 {
	x = 0;
	y = 0;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	clone() {
		return new Vector2(this.x, this.y);
	}

	add(vector: Vector2) {
		this.x += vector.x;
		this.y += vector.y;
		return this;
	}

	mul(val: Vector2 | number) {
		if (val instanceof Vector2) {
			this.x *= val.x;
			this.y *= val.y;
		} else {
			this.x *= val;
			this.y *= val;
		}

		return this;
	}

	distanceTo(point: Vector2) {
		return this.diff(point).length();
	}

	diff(point: Vector2) {
		return new Vector2(point.x - this.x, point.y - this.y);
	}

	moveNextTo(point: Vector2, distance = 10) {
		if (this.equals(point)) return point.clone();
		return this.diff(point).normalize().mul(-distance).add(point);
	}

	equals(point: Vector2) {
		return this.x === point.x && this.y === point.y;
	}

	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	normalize() {
		this.x /= this.length();
		this.y /= this.length();
		return this;
	}

	toString() {
		return `${this.x} ${this.y}`;
	}

	static from(vector: { x: number; y: number }) {
		return new Vector2(vector.x, vector.y);
	}

	static fromMany(...vectors: { x: number; y: number }[]) {
		return vectors.map(Vector2.from);
	}
}

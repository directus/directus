export interface Schema {
	categories: Categories[];
	circles: Circles[];
	departments: Departments[];
	products: Products[];
	shapes: Shapes[];
	squares: Squares[];
	suppliers: Suppliers[];
	products_suppliers_junction: ProductsSuppliersJunction[];
	shapes_builder: ShapesBuilder[];
}

export interface Categories {
	id: number;
	name: string | null;
	metadata: unknown;
	department_id: number | Departments | null;
	products: number[] | Products[];
}

export interface Circles {
	id: number;
	name: string | null;
	metadata: unknown;
}

export interface Departments {
	id: number;
	name: string | null;
	metadata: unknown;
}

export interface Products {
	id: number;
	name: string | null;
	metadata: unknown;
	data: unknown;
	suppliers: number[] | ProductsSuppliersJunction[];
	category_id: number | Categories | null;
}

export interface Shapes {
	id: number;
	name: string | null;
	children: number[] | ShapesBuilder[];
}

export interface Squares {
	id: number;
	name: string | null;
	metadata: unknown;
}

export interface Suppliers {
	id: number;
	name: string | null;
	metadata: unknown;
}

export interface ProductsSuppliersJunction {
	id: number;
	products_id: number | Products | null;
	suppliers_id: number | Suppliers | null;
}

export interface ShapesBuilder {
	id: number;
	shapes_id: number | Shapes | null;
	item: string | Circles | Squares | null;
	collection: string | null;
}

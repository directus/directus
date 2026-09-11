export type Schema = {
	categories: Categories[];
	circles: Circles[];
	departments: Departments[];
	products: Products[];
	products_suppliers: ProductsSuppliers[];
	shapes: Shapes[];
	shapes_children: ShapesChildren[];
	squares: Squares[];
	suppliers: Suppliers[];
};
export type Categories = {
	id?: string | number;
	name?: string | number;
	metadata?: string | number;
	department_id?: string | number | Departments;
	products: (string | number | Products)[];
};
export type Circles = {
	id?: string | number;
	name?: string | number;
	metadata?: string | number;
};
export type Departments = {
	id?: string | number;
	name?: string | number;
	metadata?: string | number;
};
export type Products = {
	id?: string | number;
	name?: string | number;
	metadata?: string | number;
	data?: string | number;
	category_id?: string | number | Categories;
	suppliers: (string | number | ProductsSuppliers)[];
};
export type ProductsSuppliers = {
	id?: string | number;
	products_id?: string | number | Products;
	suppliers_id?: string | number | Suppliers;
};
export type Shapes = {
	id?: string | number;
	name?: string | number;
	children: (string | number | ShapesChildren)[];
};
export type ShapesChildren = {
	id?: string | number;
	shapes_id?: string | number | Shapes;
	item?: string | number | Circles | Squares;
	collection?: string | number;
};
export type Squares = {
	id?: string | number;
	name?: string | number;
	metadata?: string | number;
};
export type Suppliers = {
	id?: string | number;
	name?: string | number;
	metadata?: string | number;
	products: (string | number | ProductsSuppliers)[];
};

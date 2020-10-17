
declare module "http" {
}

declare module "net" {
	interface Socket {
		_metrics: any;
	}
}

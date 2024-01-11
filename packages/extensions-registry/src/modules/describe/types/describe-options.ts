export interface DescribeOptions {
	/**
	 * What registry to search through. Has to support the NPM registry search API
	 * @default "https://registry.npmjs.org"
	 */
	registry?: string;
}

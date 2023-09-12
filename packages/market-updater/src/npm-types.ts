import type { Maintainer } from '@npm/types'


export type NPMSearch = {
	package: NPMSearchPackage,
	score: {
		final: number,
		detail: {
			quality: number,
			popularity: number,
			maintenance: number
		}
	},
	searchScore: number
}

export type NPMSearchResponse = {
	total: number,
	time: string,
	objects: NPMSearch[]
}

export type NPMSearchPackage = {
	name: string,
	scope: string,
	version: string,
	description: string,
	keywords: string[],
	date: string,
	links: {
		npm: string,
		homepage: string,
		repository: string,
		bugs: string
	},
	author: Maintainer,
	publisher: Maintainer,
	maintainers: Maintainer[],
}

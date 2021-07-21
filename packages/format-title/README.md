## Title Formatter

Custom string formatter that converts any string into
[Title Case](http://www.grammar-monster.com/lessons/capital_letters_title_case.htm)

This package converts any string into title case. This means only using capital letters for the principal words.
Articles, conjunctions, and prepositions do not get capital letters unless they start or end the title

| input                        | output                          |
| ---------------------------- | ------------------------------- |
| `snowWhiteAndTheSevenDwarfs` | Snow White and the Seven Dwarfs |
| `NewcastleUponTyne`          | Newcastle upon Tyne             |
| `brighton_on_sea`            | Brighton on Sea                 |
| `apple_releases_new_ipad`    | Apple Releases New iPad         |
| `7-food-trends`              | 7 Food Trends                   |

> The package contains a list of words that use some sort of special casing, for example: McDonalds, iPhone, and
> YouTube.

## Installation

```bash
$ npm install @directus/format-title
```

## Usage

The package by default converts camelCase, PascalCase, underscore, and "regular" scentences to
[Title Case](http://www.grammar-monster.com/lessons/capital_letters_title_case.htm)

```js
formatTitle(string, [separator]);

formatTitle('snowWhiteAndTheSevenDwarfs');
// => Snow White and the Seven Dwarfs
```

You can provide an optional `separator` regex as a second parameter to support splitting the string on different
characters. By default, this regex is set to `/\s|-|_/g`.

## Contributing

If your favorite specially cased word isn't being capitalized properly,
[please open an issue](https://github.com/directus/format-title/issues/new) or submit a pull request!

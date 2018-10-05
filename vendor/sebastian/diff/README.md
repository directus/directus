# sebastian/diff

Diff implementation for PHP, factored out of PHPUnit into a stand-alone component.

## Installation

You can add this library as a local, per-project dependency to your project using [Composer](https://getcomposer.org/):

    composer require sebastian/diff

If you only need this library during development, for instance to run your project's test suite, then you should add it as a development-time dependency:

    composer require --dev sebastian/diff

### Usage

The `Differ` class can be used to generate a textual representation of the difference between two strings:

```php
use SebastianBergmann\Diff\Differ;

$differ = new Differ;
print $differ->diff('foo', 'bar');
```

The code above yields the output below:

    --- Original
    +++ New
    @@ @@
    -foo
    +bar

The `Parser` class can be used to parse a unified diff into an object graph:

```php
use SebastianBergmann\Diff\Parser;
use SebastianBergmann\Git;

$git = new Git('/usr/local/src/money');

$diff = $git->getDiff(
  '948a1a07768d8edd10dcefa8315c1cbeffb31833',
  'c07a373d2399f3e686234c4f7f088d635eb9641b'
);

$parser = new Parser;

print_r($parser->parse($diff));
```

The code above yields the output below:

    Array
    (
        [0] => SebastianBergmann\Diff\Diff Object
            (
                [from:SebastianBergmann\Diff\Diff:private] => a/tests/MoneyTest.php
                [to:SebastianBergmann\Diff\Diff:private] => b/tests/MoneyTest.php
                [chunks:SebastianBergmann\Diff\Diff:private] => Array
                    (
                        [0] => SebastianBergmann\Diff\Chunk Object
                            (
                                [start:SebastianBergmann\Diff\Chunk:private] => 87
                                [startRange:SebastianBergmann\Diff\Chunk:private] => 7
                                [end:SebastianBergmann\Diff\Chunk:private] => 87
                                [endRange:SebastianBergmann\Diff\Chunk:private] => 7
                                [lines:SebastianBergmann\Diff\Chunk:private] => Array
                                    (
                                        [0] => SebastianBergmann\Diff\Line Object
                                            (
                                                [type:SebastianBergmann\Diff\Line:private] => 3
                                                [content:SebastianBergmann\Diff\Line:private] =>      * @covers SebastianBergmann\Money\Money::add
                                            )

                                        [1] => SebastianBergmann\Diff\Line Object
                                            (
                                                [type:SebastianBergmann\Diff\Line:private] => 3
                                                [content:SebastianBergmann\Diff\Line:private] =>      * @covers SebastianBergmann\Money\Money::newMoney
                                            )

                                        [2] => SebastianBergmann\Diff\Line Object
                                            (
                                                [type:SebastianBergmann\Diff\Line:private] => 3
                                                [content:SebastianBergmann\Diff\Line:private] =>      */
                                            )

                                        [3] => SebastianBergmann\Diff\Line Object
                                            (
                                                [type:SebastianBergmann\Diff\Line:private] => 2
                                                [content:SebastianBergmann\Diff\Line:private] =>     public function testAnotherMoneyWithSameCurrencyObjectCanBeAdded()
                                            )

                                        [4] => SebastianBergmann\Diff\Line Object
                                            (
                                                [type:SebastianBergmann\Diff\Line:private] => 1
                                                [content:SebastianBergmann\Diff\Line:private] =>     public function testAnotherMoneyObjectWithSameCurrencyCanBeAdded()
                                            )

                                        [5] => SebastianBergmann\Diff\Line Object
                                            (
                                                [type:SebastianBergmann\Diff\Line:private] => 3
                                                [content:SebastianBergmann\Diff\Line:private] =>     {
                                            )

                                        [6] => SebastianBergmann\Diff\Line Object
                                            (
                                                [type:SebastianBergmann\Diff\Line:private] => 3
                                                [content:SebastianBergmann\Diff\Line:private] =>         $a = new Money(1, new Currency('EUR'));
                                            )

                                        [7] => SebastianBergmann\Diff\Line Object
                                            (
                                                [type:SebastianBergmann\Diff\Line:private] => 3
                                                [content:SebastianBergmann\Diff\Line:private] =>         $b = new Money(2, new Currency('EUR'));
                                            )

                                    )

                            )

                    )

            )

    )

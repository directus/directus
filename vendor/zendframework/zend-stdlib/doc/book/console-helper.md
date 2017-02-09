# Console Helper

Writing one-off scripts or vendor binaries for a package is often problematic:

- You need to parse arguments manually.
- You need to send output to the console in a meaningful fashion:
    - Using `STDOUT` for meaningful, expected output
    - Using `STDERR` for error messages
    - Ensuring any line breaks are converted to `PHP_EOL`
    - Optionally, using console colors to provide context, which means:
        - Detecting whether or not the console supports colors in the first place
        - Providing appropriate escape sequences to produce color

`Zend\Stdlib\ConsoleHelper` helps to address the second major bullet point and
all beneath it in a minimal fashion.

## Usage

Typical usage is to instantiate a `ConsoleHelper`, and call one of its methods:

```php
use Zend\Stdlib\ConsoleHelper;

$helper = new ConsoleHelper();
$helper->writeLine('This is output');
```

You can optionally pass a PHP stream resource to the constructor, which will be
used to determine whether or not color support is available:

```php
$helper = new ConsoleHelper($stream);
```

By default, it assumes `STDOUT`, and tests against that.

## Available methods

`ConsoleHelper` provides the following methods.

### colorize

- `colorize(string $string) : string`

`colorize()` accepts a formatted string, and will then apply ANSI color
sequences to them, if color support is detected.

The following sequences are currently supported:

- `<info>...</info>` will apply a green color sequence around the provided text.
- `<error>...</error>` will apply a red color sequence around the provided text.

You may mix multiple sequences within the same stream.

### write

- `write(string $string, bool $colorize = true, resource $stream = STDOUT) : void`

Emits the provided `$string` to the provided `$stream` (which defaults to
`STDOUT` if not provided). Any EOL sequences are convered to `PHP_EOL`. If
`$colorize` is `true`, the string is first passed to `colorize()` as well.

### writeline

- `writeLine(string $string, bool $colorize = true, resource $stream = STDOUT) : void`

Same as `write()`, except it also appends a `PHP_EOL` sequence to the `$string`.

### writeErrorMessage

- `writeErrorMessage(string $message)`

Wraps `$message` in an `<error></error>` sequence, and passes it to
`writeLine()`, using `STDERR` as the `$stream`.

## Example

Below is an example class that accepts an argument list, and determines how and
what to emit.

```php
namespace Foo;

use Zend\Stdlib\ConsoleHelper;

class HelloWorld
{
    private $helper;

    public function __construct(ConsoleHelper $helper = null)
    {
        $this->helper = $helper ?: new ConsoleHelper();
    }

    public function __invoke(array $args)
    {
        if (! count($args)) {
            $this->helper->writeErrorMessage('Missing arguments!');
            return;
        }

        if (count($args) > 1) {
            $this->helper->writeErrorMessage('Too many arguments!');
            return;
        }

        $target = array_shift($args);

        $this->helper->writeLine(sprintf(
            '<info>Hello</info> %s',
            $target
        ));
    }
}
```

## When to upgrade

`ConsoleHelper` is deliberately simple, and assumes that your primary need for
console tooling is for output considerations.

If you need to parse complex argument strings, we recommend using
[zend-console](https://docs.zendframework.com/zend-console/)/[zf-console](https://github.com/zfcampus/zf-console)
or [symfony/console](http://symfony.com/doc/current/components/console.html),
as these packages provide those capabilities, as well as far more colorization
and console feature detection facilities.

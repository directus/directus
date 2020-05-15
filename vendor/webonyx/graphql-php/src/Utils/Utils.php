<?php

declare(strict_types=1);

namespace GraphQL\Utils;

use ErrorException;
use Exception;
use GraphQL\Error\Error;
use GraphQL\Error\InvariantViolation;
use GraphQL\Error\Warning;
use GraphQL\Language\AST\Node;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\WrappingType;
use InvalidArgumentException;
use LogicException;
use stdClass;
use Traversable;
use function array_keys;
use function array_map;
use function array_reduce;
use function array_shift;
use function array_slice;
use function array_values;
use function asort;
use function chr;
use function count;
use function dechex;
use function func_get_args;
use function func_num_args;
use function get_class;
use function gettype;
use function is_array;
use function is_int;
use function is_object;
use function is_scalar;
use function is_string;
use function json_encode;
use function levenshtein;
use function max;
use function mb_convert_encoding;
use function mb_strlen;
use function mb_substr;
use function method_exists;
use function ord;
use function pack;
use function preg_match;
use function property_exists;
use function range;
use function restore_error_handler;
use function set_error_handler;
use function sprintf;
use function strtolower;
use function unpack;

class Utils
{
    public static function undefined()
    {
        static $undefined;

        return $undefined ?: $undefined = new stdClass();
    }

    /**
     * Check if the value is invalid
     *
     * @param mixed $value
     *
     * @return bool
     */
    public static function isInvalid($value)
    {
        return self::undefined() === $value;
    }

    /**
     * @param object   $obj
     * @param mixed[]  $vars
     * @param string[] $requiredKeys
     *
     * @return object
     */
    public static function assign($obj, array $vars, array $requiredKeys = [])
    {
        foreach ($requiredKeys as $key) {
            if (! isset($vars[$key])) {
                throw new InvalidArgumentException(sprintf('Key %s is expected to be set and not to be null', $key));
            }
        }

        foreach ($vars as $key => $value) {
            if (! property_exists($obj, $key)) {
                $cls = get_class($obj);
                Warning::warn(
                    sprintf("Trying to set non-existing property '%s' on class '%s'", $key, $cls),
                    Warning::WARNING_ASSIGN
                );
            }
            $obj->{$key} = $value;
        }

        return $obj;
    }

    /**
     * @param mixed|Traversable $traversable
     *
     * @return mixed|null
     */
    public static function find($traversable, callable $predicate)
    {
        self::invariant(
            is_array($traversable) || $traversable instanceof Traversable,
            __METHOD__ . ' expects array or Traversable'
        );

        foreach ($traversable as $key => $value) {
            if ($predicate($value, $key)) {
                return $value;
            }
        }

        return null;
    }

    /**
     * @param mixed|Traversable $traversable
     *
     * @return mixed[]
     *
     * @throws Exception
     */
    public static function filter($traversable, callable $predicate)
    {
        self::invariant(
            is_array($traversable) || $traversable instanceof Traversable,
            __METHOD__ . ' expects array or Traversable'
        );

        $result = [];
        $assoc  = false;
        foreach ($traversable as $key => $value) {
            if (! $assoc && ! is_int($key)) {
                $assoc = true;
            }
            if (! $predicate($value, $key)) {
                continue;
            }

            $result[$key] = $value;
        }

        return $assoc ? $result : array_values($result);
    }

    /**
     * @param mixed|Traversable $traversable
     *
     * @return mixed[]
     *
     * @throws Exception
     */
    public static function map($traversable, callable $fn)
    {
        self::invariant(
            is_array($traversable) || $traversable instanceof Traversable,
            __METHOD__ . ' expects array or Traversable'
        );

        $map = [];
        foreach ($traversable as $key => $value) {
            $map[$key] = $fn($value, $key);
        }

        return $map;
    }

    /**
     * @param mixed|Traversable $traversable
     *
     * @return mixed[]
     *
     * @throws Exception
     */
    public static function mapKeyValue($traversable, callable $fn)
    {
        self::invariant(
            is_array($traversable) || $traversable instanceof Traversable,
            __METHOD__ . ' expects array or Traversable'
        );

        $map = [];
        foreach ($traversable as $key => $value) {
            [$newKey, $newValue] = $fn($value, $key);
            $map[$newKey]        = $newValue;
        }

        return $map;
    }

    /**
     * @param mixed|Traversable $traversable
     *
     * @return mixed[]
     *
     * @throws Exception
     */
    public static function keyMap($traversable, callable $keyFn)
    {
        self::invariant(
            is_array($traversable) || $traversable instanceof Traversable,
            __METHOD__ . ' expects array or Traversable'
        );

        $map = [];
        foreach ($traversable as $key => $value) {
            $newKey = $keyFn($value, $key);
            if (! is_scalar($newKey)) {
                continue;
            }

            $map[$newKey] = $value;
        }

        return $map;
    }

    public static function each($traversable, callable $fn)
    {
        self::invariant(
            is_array($traversable) || $traversable instanceof Traversable,
            __METHOD__ . ' expects array or Traversable'
        );

        foreach ($traversable as $key => $item) {
            $fn($item, $key);
        }
    }

    /**
     * Splits original traversable to several arrays with keys equal to $keyFn return
     *
     * E.g. Utils::groupBy([1, 2, 3, 4, 5], function($value) {return $value % 3}) will output:
     * [
     *    1 => [1, 4],
     *    2 => [2, 5],
     *    0 => [3],
     * ]
     *
     * $keyFn is also allowed to return array of keys. Then value will be added to all arrays with given keys
     *
     * @param mixed[]|Traversable $traversable
     *
     * @return mixed[]
     */
    public static function groupBy($traversable, callable $keyFn)
    {
        self::invariant(
            is_array($traversable) || $traversable instanceof Traversable,
            __METHOD__ . ' expects array or Traversable'
        );

        $grouped = [];
        foreach ($traversable as $key => $value) {
            $newKeys = (array) $keyFn($value, $key);
            foreach ($newKeys as $newKey) {
                $grouped[$newKey][] = $value;
            }
        }

        return $grouped;
    }

    /**
     * @param mixed[]|Traversable $traversable
     *
     * @return mixed[][]
     */
    public static function keyValMap($traversable, callable $keyFn, callable $valFn)
    {
        $map = [];
        foreach ($traversable as $item) {
            $map[$keyFn($item)] = $valFn($item);
        }

        return $map;
    }

    /**
     * @param mixed[] $traversable
     *
     * @return bool
     */
    public static function every($traversable, callable $predicate)
    {
        foreach ($traversable as $key => $value) {
            if (! $predicate($value, $key)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param bool   $test
     * @param string $message
     */
    public static function invariant($test, $message = '')
    {
        if (! $test) {
            if (func_num_args() > 2) {
                $args = func_get_args();
                array_shift($args);
                $message = sprintf(...$args);
            }
            // TODO switch to Error here
            throw new InvariantViolation($message);
        }
    }

    /**
     * @param Type|mixed $var
     *
     * @return string
     */
    public static function getVariableType($var)
    {
        if ($var instanceof Type) {
            // FIXME: Replace with schema printer call
            if ($var instanceof WrappingType) {
                $var = $var->getWrappedType(true);
            }

            return $var->name;
        }

        return is_object($var) ? get_class($var) : gettype($var);
    }

    /**
     * @param mixed $var
     *
     * @return string
     */
    public static function printSafeJson($var)
    {
        if ($var instanceof stdClass) {
            $var = (array) $var;
        }
        if (is_array($var)) {
            return json_encode($var);
        }
        if ($var === '') {
            return '(empty string)';
        }
        if ($var === null) {
            return 'null';
        }
        if ($var === false) {
            return 'false';
        }
        if ($var === true) {
            return 'true';
        }
        if (is_string($var)) {
            return sprintf('"%s"', $var);
        }
        if (is_scalar($var)) {
            return (string) $var;
        }

        return gettype($var);
    }

    /**
     * @param Type|mixed $var
     *
     * @return string
     */
    public static function printSafe($var)
    {
        if ($var instanceof Type) {
            return $var->toString();
        }
        if (is_object($var)) {
            if (method_exists($var, '__toString')) {
                return (string) $var;
            }

            return 'instance of ' . get_class($var);
        }
        if (is_array($var)) {
            return json_encode($var);
        }
        if ($var === '') {
            return '(empty string)';
        }
        if ($var === null) {
            return 'null';
        }
        if ($var === false) {
            return 'false';
        }
        if ($var === true) {
            return 'true';
        }
        if (is_string($var)) {
            return $var;
        }
        if (is_scalar($var)) {
            return (string) $var;
        }

        return gettype($var);
    }

    /**
     * UTF-8 compatible chr()
     *
     * @param string $ord
     * @param string $encoding
     *
     * @return string
     */
    public static function chr($ord, $encoding = 'UTF-8')
    {
        if ($ord <= 255) {
            return chr($ord);
        }
        if ($encoding === 'UCS-4BE') {
            return pack('N', $ord);
        }

        return mb_convert_encoding(self::chr($ord, 'UCS-4BE'), $encoding, 'UCS-4BE');
    }

    /**
     * UTF-8 compatible ord()
     *
     * @param string $char
     * @param string $encoding
     *
     * @return mixed
     */
    public static function ord($char, $encoding = 'UTF-8')
    {
        if (! $char && $char !== '0') {
            return 0;
        }
        if (! isset($char[1])) {
            return ord($char);
        }
        if ($encoding !== 'UCS-4BE') {
            $char = mb_convert_encoding($char, 'UCS-4BE', $encoding);
        }

        return unpack('N', $char)[1];
    }

    /**
     * Returns UTF-8 char code at given $positing of the $string
     *
     * @param string $string
     * @param int    $position
     *
     * @return mixed
     */
    public static function charCodeAt($string, $position)
    {
        $char = mb_substr($string, $position, 1, 'UTF-8');

        return self::ord($char);
    }

    /**
     * @param int|null $code
     *
     * @return string
     */
    public static function printCharCode($code)
    {
        if ($code === null) {
            return '<EOF>';
        }

        return $code < 0x007F
            // Trust JSON for ASCII.
            ? json_encode(self::chr($code))
            // Otherwise print the escaped form.
            : '"\\u' . dechex($code) . '"';
    }

    /**
     * Upholds the spec rules about naming.
     *
     * @param string $name
     *
     * @throws Error
     */
    public static function assertValidName($name)
    {
        $error = self::isValidNameError($name);
        if ($error) {
            throw $error;
        }
    }

    /**
     * Returns an Error if a name is invalid.
     *
     * @param string    $name
     * @param Node|null $node
     *
     * @return Error|null
     */
    public static function isValidNameError($name, $node = null)
    {
        self::invariant(is_string($name), 'Expected string');

        if (isset($name[1]) && $name[0] === '_' && $name[1] === '_') {
            return new Error(
                sprintf('Name "%s" must not begin with "__", which is reserved by ', $name) .
                'GraphQL introspection.',
                $node
            );
        }

        if (! preg_match('/^[_a-zA-Z][_a-zA-Z0-9]*$/', $name)) {
            return new Error(
                sprintf('Names must match /^[_a-zA-Z][_a-zA-Z0-9]*$/ but "%s" does not.', $name),
                $node
            );
        }

        return null;
    }

    /**
     * Wraps original callable with PHP error handling (using set_error_handler).
     * Resulting callable will collect all PHP errors that occur during the call in $errors array.
     *
     * @param ErrorException[] $errors
     *
     * @return callable
     */
    public static function withErrorHandling(callable $fn, array &$errors)
    {
        return static function () use ($fn, &$errors) {
            // Catch custom errors (to report them in query results)
            set_error_handler(static function ($severity, $message, $file, $line) use (&$errors) {
                $errors[] = new ErrorException($message, 0, $severity, $file, $line);
            });

            try {
                return $fn();
            } finally {
                restore_error_handler();
            }
        };
    }

    /**
     * @param string[] $items
     *
     * @return string
     */
    public static function quotedOrList(array $items)
    {
        $items = array_map(
            static function ($item) {
                return sprintf('"%s"', $item);
            },
            $items
        );

        return self::orList($items);
    }

    /**
     * @param string[] $items
     *
     * @return string
     */
    public static function orList(array $items)
    {
        if (count($items) === 0) {
            throw new LogicException('items must not need to be empty.');
        }
        $selected       = array_slice($items, 0, 5);
        $selectedLength = count($selected);
        $firstSelected  = $selected[0];

        if ($selectedLength === 1) {
            return $firstSelected;
        }

        return array_reduce(
            range(1, $selectedLength - 1),
            static function ($list, $index) use ($selected, $selectedLength) {
                return $list .
                    ($selectedLength > 2 ? ', ' : ' ') .
                    ($index === $selectedLength - 1 ? 'or ' : '') .
                    $selected[$index];
            },
            $firstSelected
        );
    }

    /**
     * Given an invalid input string and a list of valid options, returns a filtered
     * list of valid options sorted based on their similarity with the input.
     *
     * Includes a custom alteration from Damerau-Levenshtein to treat case changes
     * as a single edit which helps identify mis-cased values with an edit distance
     * of 1
     *
     * @param string   $input
     * @param string[] $options
     *
     * @return string[]
     */
    public static function suggestionList($input, array $options)
    {
        $optionsByDistance = [];
        $inputThreshold    = mb_strlen($input) / 2;
        foreach ($options as $option) {
            if ($input === $option) {
                $distance = 0;
            } else {
                $distance = (strtolower($input) === strtolower($option)
                    ? 1
                    : levenshtein($input, $option));
            }
            $threshold = max($inputThreshold, mb_strlen($option) / 2, 1);
            if ($distance > $threshold) {
                continue;
            }

            $optionsByDistance[$option] = $distance;
        }

        asort($optionsByDistance);

        return array_keys($optionsByDistance);
    }
}

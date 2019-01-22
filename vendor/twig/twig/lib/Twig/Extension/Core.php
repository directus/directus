<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

final class Twig_Extension_Core extends Twig_Extension
{
    private $dateFormats = ['F j, Y H:i', '%d days'];
    private $numberFormat = [0, '.', ','];
    private $timezone = null;
    private $escapers = [];

    /**
     * Defines a new escaper to be used via the escape filter.
     *
     * @param string   $strategy The strategy name that should be used as a strategy in the escape call
     * @param callable $callable A valid PHP callable
     */
    public function setEscaper($strategy, callable $callable)
    {
        $this->escapers[$strategy] = $callable;
    }

    /**
     * Gets all defined escapers.
     *
     * @return callable[] An array of escapers
     */
    public function getEscapers()
    {
        return $this->escapers;
    }

    /**
     * Sets the default format to be used by the date filter.
     *
     * @param string $format             The default date format string
     * @param string $dateIntervalFormat The default date interval format string
     */
    public function setDateFormat($format = null, $dateIntervalFormat = null)
    {
        if (null !== $format) {
            $this->dateFormats[0] = $format;
        }

        if (null !== $dateIntervalFormat) {
            $this->dateFormats[1] = $dateIntervalFormat;
        }
    }

    /**
     * Gets the default format to be used by the date filter.
     *
     * @return array The default date format string and the default date interval format string
     */
    public function getDateFormat()
    {
        return $this->dateFormats;
    }

    /**
     * Sets the default timezone to be used by the date filter.
     *
     * @param DateTimeZone|string $timezone The default timezone string or a DateTimeZone object
     */
    public function setTimezone($timezone)
    {
        $this->timezone = $timezone instanceof DateTimeZone ? $timezone : new DateTimeZone($timezone);
    }

    /**
     * Gets the default timezone to be used by the date filter.
     *
     * @return DateTimeZone The default timezone currently in use
     */
    public function getTimezone()
    {
        if (null === $this->timezone) {
            $this->timezone = new DateTimeZone(date_default_timezone_get());
        }

        return $this->timezone;
    }

    /**
     * Sets the default format to be used by the number_format filter.
     *
     * @param int    $decimal      the number of decimal places to use
     * @param string $decimalPoint the character(s) to use for the decimal point
     * @param string $thousandSep  the character(s) to use for the thousands separator
     */
    public function setNumberFormat($decimal, $decimalPoint, $thousandSep)
    {
        $this->numberFormat = [$decimal, $decimalPoint, $thousandSep];
    }

    /**
     * Get the default format used by the number_format filter.
     *
     * @return array The arguments for number_format()
     */
    public function getNumberFormat()
    {
        return $this->numberFormat;
    }

    public function getTokenParsers()
    {
        return [
            new Twig_TokenParser_For(),
            new Twig_TokenParser_If(),
            new Twig_TokenParser_Extends(),
            new Twig_TokenParser_Include(),
            new Twig_TokenParser_Block(),
            new Twig_TokenParser_Use(),
            new Twig_TokenParser_Filter(),
            new Twig_TokenParser_Macro(),
            new Twig_TokenParser_Import(),
            new Twig_TokenParser_From(),
            new Twig_TokenParser_Set(),
            new Twig_TokenParser_Spaceless(),
            new Twig_TokenParser_Flush(),
            new Twig_TokenParser_Do(),
            new Twig_TokenParser_Embed(),
            new Twig_TokenParser_With(),
            new Twig_TokenParser_Deprecated(),
        ];
    }

    public function getFilters()
    {
        return [
            // formatting filters
            new Twig_Filter('date', 'twig_date_format_filter', ['needs_environment' => true]),
            new Twig_Filter('date_modify', 'twig_date_modify_filter', ['needs_environment' => true]),
            new Twig_Filter('format', 'sprintf'),
            new Twig_Filter('replace', 'twig_replace_filter'),
            new Twig_Filter('number_format', 'twig_number_format_filter', ['needs_environment' => true]),
            new Twig_Filter('abs', 'abs'),
            new Twig_Filter('round', 'twig_round'),

            // encoding
            new Twig_Filter('url_encode', 'twig_urlencode_filter'),
            new Twig_Filter('json_encode', 'json_encode'),
            new Twig_Filter('convert_encoding', 'twig_convert_encoding'),

            // string filters
            new Twig_Filter('title', 'twig_title_string_filter', ['needs_environment' => true]),
            new Twig_Filter('capitalize', 'twig_capitalize_string_filter', ['needs_environment' => true]),
            new Twig_Filter('upper', 'twig_upper_filter', ['needs_environment' => true]),
            new Twig_Filter('lower', 'twig_lower_filter', ['needs_environment' => true]),
            new Twig_Filter('striptags', 'strip_tags'),
            new Twig_Filter('trim', 'twig_trim_filter'),
            new Twig_Filter('nl2br', 'nl2br', ['pre_escape' => 'html', 'is_safe' => ['html']]),

            // array helpers
            new Twig_Filter('join', 'twig_join_filter'),
            new Twig_Filter('split', 'twig_split_filter', ['needs_environment' => true]),
            new Twig_Filter('sort', 'twig_sort_filter'),
            new Twig_Filter('merge', 'twig_array_merge'),
            new Twig_Filter('batch', 'twig_array_batch'),

            // string/array filters
            new Twig_Filter('reverse', 'twig_reverse_filter', ['needs_environment' => true]),
            new Twig_Filter('length', 'twig_length_filter', ['needs_environment' => true]),
            new Twig_Filter('slice', 'twig_slice', ['needs_environment' => true]),
            new Twig_Filter('first', 'twig_first', ['needs_environment' => true]),
            new Twig_Filter('last', 'twig_last', ['needs_environment' => true]),

            // iteration and runtime
            new Twig_Filter('default', '_twig_default_filter', ['node_class' => 'Twig_Node_Expression_Filter_Default']),
            new Twig_Filter('keys', 'twig_get_array_keys_filter'),

            // escaping
            new Twig_Filter('escape', 'twig_escape_filter', ['needs_environment' => true, 'is_safe_callback' => 'twig_escape_filter_is_safe']),
            new Twig_Filter('e', 'twig_escape_filter', ['needs_environment' => true, 'is_safe_callback' => 'twig_escape_filter_is_safe']),
        ];
    }

    public function getFunctions()
    {
        return [
            new Twig_Function('max', 'max'),
            new Twig_Function('min', 'min'),
            new Twig_Function('range', 'range'),
            new Twig_Function('constant', 'twig_constant'),
            new Twig_Function('cycle', 'twig_cycle'),
            new Twig_Function('random', 'twig_random', ['needs_environment' => true]),
            new Twig_Function('date', 'twig_date_converter', ['needs_environment' => true]),
            new Twig_Function('include', 'twig_include', ['needs_environment' => true, 'needs_context' => true, 'is_safe' => ['all']]),
            new Twig_Function('source', 'twig_source', ['needs_environment' => true, 'is_safe' => ['all']]),
        ];
    }

    public function getTests()
    {
        return [
            new Twig_Test('even', null, ['node_class' => 'Twig_Node_Expression_Test_Even']),
            new Twig_Test('odd', null, ['node_class' => 'Twig_Node_Expression_Test_Odd']),
            new Twig_Test('defined', null, ['node_class' => 'Twig_Node_Expression_Test_Defined']),
            new Twig_Test('same as', null, ['node_class' => 'Twig_Node_Expression_Test_Sameas']),
            new Twig_Test('none', null, ['node_class' => 'Twig_Node_Expression_Test_Null']),
            new Twig_Test('null', null, ['node_class' => 'Twig_Node_Expression_Test_Null']),
            new Twig_Test('divisible by', null, ['node_class' => 'Twig_Node_Expression_Test_Divisibleby']),
            new Twig_Test('constant', null, ['node_class' => 'Twig_Node_Expression_Test_Constant']),
            new Twig_Test('empty', 'twig_test_empty'),
            new Twig_Test('iterable', 'twig_test_iterable'),
        ];
    }

    public function getOperators()
    {
        return [
            [
                'not' => ['precedence' => 50, 'class' => 'Twig_Node_Expression_Unary_Not'],
                '-' => ['precedence' => 500, 'class' => 'Twig_Node_Expression_Unary_Neg'],
                '+' => ['precedence' => 500, 'class' => 'Twig_Node_Expression_Unary_Pos'],
            ],
            [
                'or' => ['precedence' => 10, 'class' => 'Twig_Node_Expression_Binary_Or', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                'and' => ['precedence' => 15, 'class' => 'Twig_Node_Expression_Binary_And', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                'b-or' => ['precedence' => 16, 'class' => 'Twig_Node_Expression_Binary_BitwiseOr', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                'b-xor' => ['precedence' => 17, 'class' => 'Twig_Node_Expression_Binary_BitwiseXor', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                'b-and' => ['precedence' => 18, 'class' => 'Twig_Node_Expression_Binary_BitwiseAnd', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                '==' => ['precedence' => 20, 'class' => 'Twig_Node_Expression_Binary_Equal', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                '!=' => ['precedence' => 20, 'class' => 'Twig_Node_Expression_Binary_NotEqual', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                '<' => ['precedence' => 20, 'class' => 'Twig_Node_Expression_Binary_Less', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                '>' => ['precedence' => 20, 'class' => 'Twig_Node_Expression_Binary_Greater', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                '>=' => ['precedence' => 20, 'class' => 'Twig_Node_Expression_Binary_GreaterEqual', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                '<=' => ['precedence' => 20, 'class' => 'Twig_Node_Expression_Binary_LessEqual', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                'not in' => ['precedence' => 20, 'class' => 'Twig_Node_Expression_Binary_NotIn', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                'in' => ['precedence' => 20, 'class' => 'Twig_Node_Expression_Binary_In', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                'matches' => ['precedence' => 20, 'class' => 'Twig_Node_Expression_Binary_Matches', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                'starts with' => ['precedence' => 20, 'class' => 'Twig_Node_Expression_Binary_StartsWith', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                'ends with' => ['precedence' => 20, 'class' => 'Twig_Node_Expression_Binary_EndsWith', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                '..' => ['precedence' => 25, 'class' => 'Twig_Node_Expression_Binary_Range', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                '+' => ['precedence' => 30, 'class' => 'Twig_Node_Expression_Binary_Add', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                '-' => ['precedence' => 30, 'class' => 'Twig_Node_Expression_Binary_Sub', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                '~' => ['precedence' => 40, 'class' => 'Twig_Node_Expression_Binary_Concat', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                '*' => ['precedence' => 60, 'class' => 'Twig_Node_Expression_Binary_Mul', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                '/' => ['precedence' => 60, 'class' => 'Twig_Node_Expression_Binary_Div', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                '//' => ['precedence' => 60, 'class' => 'Twig_Node_Expression_Binary_FloorDiv', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                '%' => ['precedence' => 60, 'class' => 'Twig_Node_Expression_Binary_Mod', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                'is' => ['precedence' => 100, 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                'is not' => ['precedence' => 100, 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT],
                '**' => ['precedence' => 200, 'class' => 'Twig_Node_Expression_Binary_Power', 'associativity' => Twig_ExpressionParser::OPERATOR_RIGHT],
                '??' => ['precedence' => 300, 'class' => 'Twig_Node_Expression_NullCoalesce', 'associativity' => Twig_ExpressionParser::OPERATOR_RIGHT],
            ],
        ];
    }
}

/**
 * Cycles over a value.
 *
 * @param ArrayAccess|array $values
 * @param int               $position The cycle position
 *
 * @return string The next value in the cycle
 */
function twig_cycle($values, $position)
{
    if (!is_array($values) && !$values instanceof ArrayAccess) {
        return $values;
    }

    return $values[$position % count($values)];
}

/**
 * Returns a random value depending on the supplied parameter type:
 * - a random item from a Traversable or array
 * - a random character from a string
 * - a random integer between 0 and the integer parameter.
 *
 * @param Twig_Environment                   $env
 * @param Traversable|array|int|float|string $values The values to pick a random item from
 *
 * @throws Twig_Error_Runtime when $values is an empty array (does not apply to an empty string which is returned as is)
 *
 * @return mixed A random value from the given sequence
 */
function twig_random(Twig_Environment $env, $values = null)
{
    if (null === $values) {
        return mt_rand();
    }

    if (is_int($values) || is_float($values)) {
        return $values < 0 ? mt_rand($values, 0) : mt_rand(0, $values);
    }

    if ($values instanceof Traversable) {
        $values = iterator_to_array($values);
    } elseif (is_string($values)) {
        if ('' === $values) {
            return '';
        }

        $charset = $env->getCharset();

        if ('UTF-8' !== $charset) {
            $values = iconv($charset, 'UTF-8', $values);
        }

        // unicode version of str_split()
        // split at all positions, but not after the start and not before the end
        $values = preg_split('/(?<!^)(?!$)/u', $values);

        if ('UTF-8' !== $charset) {
            foreach ($values as $i => $value) {
                $values[$i] = iconv('UTF-8', $charset, $value);
            }
        }
    }

    if (!is_array($values)) {
        return $values;
    }

    if (0 === count($values)) {
        throw new Twig_Error_Runtime('The random function cannot pick from an empty array.');
    }

    return $values[array_rand($values, 1)];
}

/**
 * Converts a date to the given format.
 *
 * <pre>
 *   {{ post.published_at|date("m/d/Y") }}
 * </pre>
 *
 * @param Twig_Environment                      $env
 * @param DateTimeInterface|DateInterval|string $date     A date
 * @param string|null                           $format   The target format, null to use the default
 * @param DateTimeZone|string|false|null        $timezone The target timezone, null to use the default, false to leave unchanged
 *
 * @return string The formatted date
 */
function twig_date_format_filter(Twig_Environment $env, $date, $format = null, $timezone = null)
{
    if (null === $format) {
        $formats = $env->getExtension('Twig_Extension_Core')->getDateFormat();
        $format = $date instanceof DateInterval ? $formats[1] : $formats[0];
    }

    if ($date instanceof DateInterval) {
        return $date->format($format);
    }

    return twig_date_converter($env, $date, $timezone)->format($format);
}

/**
 * Returns a new date object modified.
 *
 * <pre>
 *   {{ post.published_at|date_modify("-1day")|date("m/d/Y") }}
 * </pre>
 *
 * @param Twig_Environment         $env
 * @param DateTimeInterface|string $date     A date
 * @param string                   $modifier A modifier string
 *
 * @return DateTimeInterface A new date object
 */
function twig_date_modify_filter(Twig_Environment $env, $date, $modifier)
{
    $date = twig_date_converter($env, $date, false);

    return $date->modify($modifier);
}

/**
 * Converts an input to a DateTime instance.
 *
 * <pre>
 *    {% if date(user.created_at) < date('+2days') %}
 *      {# do something #}
 *    {% endif %}
 * </pre>
 *
 * @param Twig_Environment               $env
 * @param DateTimeInterface|string|null  $date     A date or null to use the current time
 * @param DateTimeZone|string|false|null $timezone The target timezone, null to use the default, false to leave unchanged
 *
 * @return DateTime A DateTime instance
 */
function twig_date_converter(Twig_Environment $env, $date = null, $timezone = null)
{
    // determine the timezone
    if (false !== $timezone) {
        if (null === $timezone) {
            $timezone = $env->getExtension('Twig_Extension_Core')->getTimezone();
        } elseif (!$timezone instanceof DateTimeZone) {
            $timezone = new DateTimeZone($timezone);
        }
    }

    // immutable dates
    if ($date instanceof DateTimeImmutable) {
        return false !== $timezone ? $date->setTimezone($timezone) : $date;
    }

    if ($date instanceof DateTimeInterface) {
        $date = clone $date;
        if (false !== $timezone) {
            $date->setTimezone($timezone);
        }

        return $date;
    }

    if (null === $date || 'now' === $date) {
        return new DateTime($date, false !== $timezone ? $timezone : $env->getExtension('Twig_Extension_Core')->getTimezone());
    }

    $asString = (string) $date;
    if (ctype_digit($asString) || (!empty($asString) && '-' === $asString[0] && ctype_digit(substr($asString, 1)))) {
        $date = new DateTime('@'.$date);
    } else {
        $date = new DateTime($date, $env->getExtension('Twig_Extension_Core')->getTimezone());
    }

    if (false !== $timezone) {
        $date->setTimezone($timezone);
    }

    return $date;
}

/**
 * Replaces strings within a string.
 *
 * @param string            $str  String to replace in
 * @param array|Traversable $from Replace values
 *
 * @return string
 */
function twig_replace_filter($str, $from)
{
    if ($from instanceof Traversable) {
        $from = iterator_to_array($from);
    } elseif (!is_array($from)) {
        throw new Twig_Error_Runtime(sprintf('The "replace" filter expects an array or "Traversable" as replace values, got "%s".', is_object($from) ? get_class($from) : gettype($from)));
    }

    return strtr($str, $from);
}

/**
 * Rounds a number.
 *
 * @param int|float $value     The value to round
 * @param int|float $precision The rounding precision
 * @param string    $method    The method to use for rounding
 *
 * @return int|float The rounded number
 */
function twig_round($value, $precision = 0, $method = 'common')
{
    if ('common' == $method) {
        return round($value, $precision);
    }

    if ('ceil' != $method && 'floor' != $method) {
        throw new Twig_Error_Runtime('The round filter only supports the "common", "ceil", and "floor" methods.');
    }

    return $method($value * pow(10, $precision)) / pow(10, $precision);
}

/**
 * Number format filter.
 *
 * All of the formatting options can be left null, in that case the defaults will
 * be used.  Supplying any of the parameters will override the defaults set in the
 * environment object.
 *
 * @param Twig_Environment $env
 * @param mixed            $number       A float/int/string of the number to format
 * @param int              $decimal      the number of decimal points to display
 * @param string           $decimalPoint the character(s) to use for the decimal point
 * @param string           $thousandSep  the character(s) to use for the thousands separator
 *
 * @return string The formatted number
 */
function twig_number_format_filter(Twig_Environment $env, $number, $decimal = null, $decimalPoint = null, $thousandSep = null)
{
    $defaults = $env->getExtension('Twig_Extension_Core')->getNumberFormat();
    if (null === $decimal) {
        $decimal = $defaults[0];
    }

    if (null === $decimalPoint) {
        $decimalPoint = $defaults[1];
    }

    if (null === $thousandSep) {
        $thousandSep = $defaults[2];
    }

    return number_format((float) $number, $decimal, $decimalPoint, $thousandSep);
}

/**
 * URL encodes (RFC 3986) a string as a path segment or an array as a query string.
 *
 * @param string|array $url A URL or an array of query parameters
 *
 * @return string The URL encoded value
 */
function twig_urlencode_filter($url)
{
    if (is_array($url)) {
        return http_build_query($url, '', '&', PHP_QUERY_RFC3986);
    }

    return rawurlencode($url);
}

/**
 * Merges an array with another one.
 *
 * <pre>
 *  {% set items = { 'apple': 'fruit', 'orange': 'fruit' } %}
 *
 *  {% set items = items|merge({ 'peugeot': 'car' }) %}
 *
 *  {# items now contains { 'apple': 'fruit', 'orange': 'fruit', 'peugeot': 'car' } #}
 * </pre>
 *
 * @param array|Traversable $arr1 An array
 * @param array|Traversable $arr2 An array
 *
 * @return array The merged array
 */
function twig_array_merge($arr1, $arr2)
{
    if ($arr1 instanceof Traversable) {
        $arr1 = iterator_to_array($arr1);
    } elseif (!is_array($arr1)) {
        throw new Twig_Error_Runtime(sprintf('The merge filter only works with arrays or "Traversable", got "%s" as first argument.', gettype($arr1)));
    }

    if ($arr2 instanceof Traversable) {
        $arr2 = iterator_to_array($arr2);
    } elseif (!is_array($arr2)) {
        throw new Twig_Error_Runtime(sprintf('The merge filter only works with arrays or "Traversable", got "%s" as second argument.', gettype($arr2)));
    }

    return array_merge($arr1, $arr2);
}

/**
 * Slices a variable.
 *
 * @param Twig_Environment $env
 * @param mixed            $item         A variable
 * @param int              $start        Start of the slice
 * @param int              $length       Size of the slice
 * @param bool             $preserveKeys Whether to preserve key or not (when the input is an array)
 *
 * @return mixed The sliced variable
 */
function twig_slice(Twig_Environment $env, $item, $start, $length = null, $preserveKeys = false)
{
    if ($item instanceof Traversable) {
        while ($item instanceof IteratorAggregate) {
            $item = $item->getIterator();
        }

        if ($start >= 0 && $length >= 0 && $item instanceof Iterator) {
            try {
                return iterator_to_array(new LimitIterator($item, $start, null === $length ? -1 : $length), $preserveKeys);
            } catch (OutOfBoundsException $exception) {
                return [];
            }
        }

        $item = iterator_to_array($item, $preserveKeys);
    }

    if (is_array($item)) {
        return array_slice($item, $start, $length, $preserveKeys);
    }

    $item = (string) $item;

    return (string) mb_substr($item, $start, $length, $env->getCharset());
}

/**
 * Returns the first element of the item.
 *
 * @param Twig_Environment $env
 * @param mixed            $item A variable
 *
 * @return mixed The first element of the item
 */
function twig_first(Twig_Environment $env, $item)
{
    $elements = twig_slice($env, $item, 0, 1, false);

    return is_string($elements) ? $elements : current($elements);
}

/**
 * Returns the last element of the item.
 *
 * @param Twig_Environment $env
 * @param mixed            $item A variable
 *
 * @return mixed The last element of the item
 */
function twig_last(Twig_Environment $env, $item)
{
    $elements = twig_slice($env, $item, -1, 1, false);

    return is_string($elements) ? $elements : current($elements);
}

/**
 * Joins the values to a string.
 *
 * The separators between elements are empty strings per default, you can define them with the optional parameters.
 *
 * <pre>
 *  {{ [1, 2, 3]|join(', ', ' and ') }}
 *  {# returns 1, 2 and 3 #}
 *
 *  {{ [1, 2, 3]|join('|') }}
 *  {# returns 1|2|3 #}
 *
 *  {{ [1, 2, 3]|join }}
 *  {# returns 123 #}
 * </pre>
 *
 * @param array       $value An array
 * @param string      $glue  The separator
 * @param string|null $and   The separator for the last pair
 *
 * @return string The concatenated string
 */
function twig_join_filter($value, $glue = '', $and = null)
{
    if ($value instanceof Traversable) {
        $value = iterator_to_array($value, false);
    } else {
        $value = (array) $value;
    }

    if (0 === count($value)) {
        return '';
    }

    if (null === $and || $and === $glue) {
        return implode($glue, $value);
    }

    $v = array_values($value);
    if (1 === count($v)) {
        return $v[0];
    }

    return implode($glue, array_slice($value, 0, -1)).$and.$v[count($v) - 1];
}

/**
 * Splits the string into an array.
 *
 * <pre>
 *  {{ "one,two,three"|split(',') }}
 *  {# returns [one, two, three] #}
 *
 *  {{ "one,two,three,four,five"|split(',', 3) }}
 *  {# returns [one, two, "three,four,five"] #}
 *
 *  {{ "123"|split('') }}
 *  {# returns [1, 2, 3] #}
 *
 *  {{ "aabbcc"|split('', 2) }}
 *  {# returns [aa, bb, cc] #}
 * </pre>
 *
 * @param Twig_Environment $env
 * @param string           $value     A string
 * @param string           $delimiter The delimiter
 * @param int              $limit     The limit
 *
 * @return array The split string as an array
 */
function twig_split_filter(Twig_Environment $env, $value, $delimiter, $limit = null)
{
    if (!empty($delimiter)) {
        return null === $limit ? explode($delimiter, $value) : explode($delimiter, $value, $limit);
    }

    if ($limit <= 1) {
        return preg_split('/(?<!^)(?!$)/u', $value);
    }

    $length = mb_strlen($value, $env->getCharset());
    if ($length < $limit) {
        return [$value];
    }

    $r = [];
    for ($i = 0; $i < $length; $i += $limit) {
        $r[] = mb_substr($value, $i, $limit, $env->getCharset());
    }

    return $r;
}

// The '_default' filter is used internally to avoid using the ternary operator
// which costs a lot for big contexts (before PHP 5.4). So, on average,
// a function call is cheaper.
/**
 * @internal
 */
function _twig_default_filter($value, $default = '')
{
    if (twig_test_empty($value)) {
        return $default;
    }

    return $value;
}

/**
 * Returns the keys for the given array.
 *
 * It is useful when you want to iterate over the keys of an array:
 *
 * <pre>
 *  {% for key in array|keys %}
 *      {# ... #}
 *  {% endfor %}
 * </pre>
 *
 * @param array $array An array
 *
 * @return array The keys
 */
function twig_get_array_keys_filter($array)
{
    if ($array instanceof Traversable) {
        while ($array instanceof IteratorAggregate) {
            $array = $array->getIterator();
        }

        if ($array instanceof Iterator) {
            $keys = [];
            $array->rewind();
            while ($array->valid()) {
                $keys[] = $array->key();
                $array->next();
            }

            return $keys;
        }

        $keys = [];
        foreach ($array as $key => $item) {
            $keys[] = $key;
        }

        return $keys;
    }

    if (!is_array($array)) {
        return [];
    }

    return array_keys($array);
}

/**
 * Reverses a variable.
 *
 * @param Twig_Environment         $env
 * @param array|Traversable|string $item         An array, a Traversable instance, or a string
 * @param bool                     $preserveKeys Whether to preserve key or not
 *
 * @return mixed The reversed input
 */
function twig_reverse_filter(Twig_Environment $env, $item, $preserveKeys = false)
{
    if ($item instanceof Traversable) {
        return array_reverse(iterator_to_array($item), $preserveKeys);
    }

    if (is_array($item)) {
        return array_reverse($item, $preserveKeys);
    }

    $string = (string) $item;

    $charset = $env->getCharset();

    if ('UTF-8' !== $charset) {
        $item = iconv($charset, 'UTF-8', $string);
    }

    preg_match_all('/./us', $item, $matches);

    $string = implode('', array_reverse($matches[0]));

    if ('UTF-8' !== $charset) {
        $string = iconv('UTF-8', $charset, $string);
    }

    return $string;
}

/**
 * Sorts an array.
 *
 * @param array|Traversable $array
 *
 * @return array
 */
function twig_sort_filter($array)
{
    if ($array instanceof Traversable) {
        $array = iterator_to_array($array);
    } elseif (!is_array($array)) {
        throw new Twig_Error_Runtime(sprintf('The sort filter only works with arrays or "Traversable", got "%s".', gettype($array)));
    }

    asort($array);

    return $array;
}

/**
 * @internal
 */
function twig_in_filter($value, $compare)
{
    if (is_array($compare)) {
        return in_array($value, $compare, is_object($value) || is_resource($value));
    } elseif (is_string($compare) && (is_string($value) || is_int($value) || is_float($value))) {
        return '' === $value || false !== strpos($compare, (string) $value);
    } elseif ($compare instanceof Traversable) {
        if (is_object($value) || is_resource($value)) {
            foreach ($compare as $item) {
                if ($item === $value) {
                    return true;
                }
            }
        } else {
            foreach ($compare as $item) {
                if ($item == $value) {
                    return true;
                }
            }
        }

        return false;
    }

    return false;
}

/**
 * Returns a trimmed string.
 *
 * @return string
 *
 * @throws Twig_Error_Runtime When an invalid trimming side is used (not a string or not 'left', 'right', or 'both')
 */
function twig_trim_filter($string, $characterMask = null, $side = 'both')
{
    if (null === $characterMask) {
        $characterMask = " \t\n\r\0\x0B";
    }

    switch ($side) {
        case 'both':
            return trim($string, $characterMask);
        case 'left':
            return ltrim($string, $characterMask);
        case 'right':
            return rtrim($string, $characterMask);
        default:
            throw new Twig_Error_Runtime('Trimming side must be "left", "right" or "both".');
    }
}

/**
 * Escapes a string.
 *
 * @param Twig_Environment $env
 * @param mixed            $string     The value to be escaped
 * @param string           $strategy   The escaping strategy
 * @param string           $charset    The charset
 * @param bool             $autoescape Whether the function is called by the auto-escaping feature (true) or by the developer (false)
 *
 * @return string
 */
function twig_escape_filter(Twig_Environment $env, $string, $strategy = 'html', $charset = null, $autoescape = false)
{
    if ($autoescape && $string instanceof Twig_Markup) {
        return $string;
    }

    if (!is_string($string)) {
        if (is_object($string) && method_exists($string, '__toString')) {
            $string = (string) $string;
        } elseif (in_array($strategy, ['html', 'js', 'css', 'html_attr', 'url'])) {
            return $string;
        }
    }

    if ('' === $string) {
        return '';
    }

    if (null === $charset) {
        $charset = $env->getCharset();
    }

    switch ($strategy) {
        case 'html':
            // see https://secure.php.net/htmlspecialchars

            // Using a static variable to avoid initializing the array
            // each time the function is called. Moving the declaration on the
            // top of the function slow downs other escaping strategies.
            static $htmlspecialcharsCharsets = [
                'ISO-8859-1' => true, 'ISO8859-1' => true,
                'ISO-8859-15' => true, 'ISO8859-15' => true,
                'utf-8' => true, 'UTF-8' => true,
                'CP866' => true, 'IBM866' => true, '866' => true,
                'CP1251' => true, 'WINDOWS-1251' => true, 'WIN-1251' => true,
                '1251' => true,
                'CP1252' => true, 'WINDOWS-1252' => true, '1252' => true,
                'KOI8-R' => true, 'KOI8-RU' => true, 'KOI8R' => true,
                'BIG5' => true, '950' => true,
                'GB2312' => true, '936' => true,
                'BIG5-HKSCS' => true,
                'SHIFT_JIS' => true, 'SJIS' => true, '932' => true,
                'EUC-JP' => true, 'EUCJP' => true,
                'ISO8859-5' => true, 'ISO-8859-5' => true, 'MACROMAN' => true,
            ];

            if (isset($htmlspecialcharsCharsets[$charset])) {
                return htmlspecialchars($string, ENT_QUOTES | ENT_SUBSTITUTE, $charset);
            }

            if (isset($htmlspecialcharsCharsets[strtoupper($charset)])) {
                // cache the lowercase variant for future iterations
                $htmlspecialcharsCharsets[$charset] = true;

                return htmlspecialchars($string, ENT_QUOTES | ENT_SUBSTITUTE, $charset);
            }

            $string = iconv($charset, 'UTF-8', $string);
            $string = htmlspecialchars($string, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

            return iconv('UTF-8', $charset, $string);

        case 'js':
            // escape all non-alphanumeric characters
            // into their \x or \uHHHH representations
            if ('UTF-8' !== $charset) {
                $string = iconv($charset, 'UTF-8', $string);
            }

            if (!preg_match('//u', $string)) {
                throw new Twig_Error_Runtime('The string to escape is not a valid UTF-8 string.');
            }

            $string = preg_replace_callback('#[^a-zA-Z0-9,\._]#Su', function ($matches) {
                $char = $matches[0];

                /*
                 * A few characters have short escape sequences in JSON and JavaScript.
                 * Escape sequences supported only by JavaScript, not JSON, are ommitted.
                 * \" is also supported but omitted, because the resulting string is not HTML safe.
                 */
                static $shortMap = [
                    '\\' => '\\\\',
                    '/' => '\\/',
                    "\x08" => '\b',
                    "\x0C" => '\f',
                    "\x0A" => '\n',
                    "\x0D" => '\r',
                    "\x09" => '\t',
                ];

                if (isset($shortMap[$char])) {
                    return $shortMap[$char];
                }

                // \uHHHH
                $char = twig_convert_encoding($char, 'UTF-16BE', 'UTF-8');
                $char = strtoupper(bin2hex($char));

                if (4 >= strlen($char)) {
                    return sprintf('\u%04s', $char);
                }

                return sprintf('\u%04s\u%04s', substr($char, 0, -4), substr($char, -4));
            }, $string);

            if ('UTF-8' !== $charset) {
                $string = iconv('UTF-8', $charset, $string);
            }

            return $string;

        case 'css':
            if ('UTF-8' !== $charset) {
                $string = iconv($charset, 'UTF-8', $string);
            }

            if (!preg_match('//u', $string)) {
                throw new Twig_Error_Runtime('The string to escape is not a valid UTF-8 string.');
            }

            $string = preg_replace_callback('#[^a-zA-Z0-9]#Su', function ($matches) {
                $char = $matches[0];

                return sprintf('\\%X ', 1 === strlen($char) ? ord($char) : mb_ord($char, 'UTF-8'));
            }, $string);

            if ('UTF-8' !== $charset) {
                $string = iconv('UTF-8', $charset, $string);
            }

            return $string;

        case 'html_attr':
            if ('UTF-8' !== $charset) {
                $string = iconv($charset, 'UTF-8', $string);
            }

            if (!preg_match('//u', $string)) {
                throw new Twig_Error_Runtime('The string to escape is not a valid UTF-8 string.');
            }

            $string = preg_replace_callback('#[^a-zA-Z0-9,\.\-_]#Su', function ($matches) {
                /**
                 * This function is adapted from code coming from Zend Framework.
                 *
                 * @copyright Copyright (c) 2005-2012 Zend Technologies USA Inc. (https://www.zend.com)
                 * @license   https://framework.zend.com/license/new-bsd New BSD License
                 */
                $chr = $matches[0];
                $ord = ord($chr);

                /*
                 * The following replaces characters undefined in HTML with the
                 * hex entity for the Unicode replacement character.
                 */
                if (($ord <= 0x1f && "\t" != $chr && "\n" != $chr && "\r" != $chr) || ($ord >= 0x7f && $ord <= 0x9f)) {
                    return '&#xFFFD;';
                }

                /*
                 * Check if the current character to escape has a name entity we should
                 * replace it with while grabbing the hex value of the character.
                 */
                if (1 === strlen($chr)) {
                    /*
                     * While HTML supports far more named entities, the lowest common denominator
                     * has become HTML5's XML Serialisation which is restricted to the those named
                     * entities that XML supports. Using HTML entities would result in this error:
                     *     XML Parsing Error: undefined entity
                     */
                    static $entityMap = [
                        34 => '&quot;', /* quotation mark */
                        38 => '&amp;',  /* ampersand */
                        60 => '&lt;',   /* less-than sign */
                        62 => '&gt;',   /* greater-than sign */
                    ];

                    if (isset($entityMap[$ord])) {
                        return $entityMap[$ord];
                    }

                    return sprintf('&#x%02X;', $ord);
                }

                /*
                 * Per OWASP recommendations, we'll use hex entities for any other
                 * characters where a named entity does not exist.
                 */
                return sprintf('&#x%04X;', mb_ord($chr, 'UTF-8'));
            }, $string);

            if ('UTF-8' !== $charset) {
                $string = iconv('UTF-8', $charset, $string);
            }

            return $string;

        case 'url':
            return rawurlencode($string);

        default:
            static $escapers;

            if (null === $escapers) {
                $escapers = $env->getExtension('Twig_Extension_Core')->getEscapers();
            }

            if (isset($escapers[$strategy])) {
                return $escapers[$strategy]($env, $string, $charset);
            }

            $validStrategies = implode(', ', array_merge(['html', 'js', 'url', 'css', 'html_attr'], array_keys($escapers)));

            throw new Twig_Error_Runtime(sprintf('Invalid escaping strategy "%s" (valid ones: %s).', $strategy, $validStrategies));
    }
}

/**
 * @internal
 */
function twig_escape_filter_is_safe(Twig_Node $filterArgs)
{
    foreach ($filterArgs as $arg) {
        if ($arg instanceof Twig_Node_Expression_Constant) {
            return [$arg->getAttribute('value')];
        }

        return [];
    }

    return ['html'];
}

function twig_convert_encoding($string, $to, $from)
{
    return iconv($from, $to, $string);
}

/**
 * Returns the length of a variable.
 *
 * @param Twig_Environment $env   A Twig_Environment instance
 * @param mixed            $thing A variable
 *
 * @return int The length of the value
 */
function twig_length_filter(Twig_Environment $env, $thing)
{
    if (null === $thing) {
        return 0;
    }

    if (is_scalar($thing)) {
        return mb_strlen($thing, $env->getCharset());
    }

    if ($thing instanceof \SimpleXMLElement) {
        return count($thing);
    }

    if (method_exists($thing, '__toString') && !$thing instanceof \Countable) {
        return mb_strlen((string) $thing, $env->getCharset());
    }

    if ($thing instanceof \Countable || is_array($thing)) {
        return count($thing);
    }

    if ($thing instanceof \IteratorAggregate) {
        return iterator_count($thing);
    }

    return 1;
}

/**
 * Converts a string to uppercase.
 *
 * @param Twig_Environment $env
 * @param string           $string A string
 *
 * @return string The uppercased string
 */
function twig_upper_filter(Twig_Environment $env, $string)
{
    return mb_strtoupper($string, $env->getCharset());
}

/**
 * Converts a string to lowercase.
 *
 * @param Twig_Environment $env
 * @param string           $string A string
 *
 * @return string The lowercased string
 */
function twig_lower_filter(Twig_Environment $env, $string)
{
    return mb_strtolower($string, $env->getCharset());
}

/**
 * Returns a titlecased string.
 *
 * @param Twig_Environment $env
 * @param string           $string A string
 *
 * @return string The titlecased string
 */
function twig_title_string_filter(Twig_Environment $env, $string)
{
    if (null !== $charset = $env->getCharset()) {
        return mb_convert_case($string, MB_CASE_TITLE, $charset);
    }

    return ucwords(strtolower($string));
}

/**
 * Returns a capitalized string.
 *
 * @param Twig_Environment $env
 * @param string           $string A string
 *
 * @return string The capitalized string
 */
function twig_capitalize_string_filter(Twig_Environment $env, $string)
{
    $charset = $env->getCharset();

    return mb_strtoupper(mb_substr($string, 0, 1, $charset), $charset).mb_strtolower(mb_substr($string, 1, null, $charset), $charset);
}

/**
 * @internal
 */
function twig_ensure_traversable($seq)
{
    if ($seq instanceof Traversable || is_array($seq)) {
        return $seq;
    }

    return [];
}

/**
 * Checks if a variable is empty.
 *
 * <pre>
 * {# evaluates to true if the foo variable is null, false, or the empty string #}
 * {% if foo is empty %}
 *     {# ... #}
 * {% endif %}
 * </pre>
 *
 * @param mixed $value A variable
 *
 * @return bool true if the value is empty, false otherwise
 */
function twig_test_empty($value)
{
    if ($value instanceof Countable) {
        return 0 == count($value);
    }

    if (is_object($value) && method_exists($value, '__toString')) {
        return '' === (string) $value;
    }

    return '' === $value || false === $value || null === $value || [] === $value;
}

/**
 * Checks if a variable is traversable.
 *
 * <pre>
 * {# evaluates to true if the foo variable is an array or a traversable object #}
 * {% if foo is iterable %}
 *     {# ... #}
 * {% endif %}
 * </pre>
 *
 * @param mixed $value A variable
 *
 * @return bool true if the value is traversable
 */
function twig_test_iterable($value)
{
    return $value instanceof Traversable || is_array($value);
}

/**
 * Renders a template.
 *
 * @param Twig_Environment $env
 * @param array            $context
 * @param string|array     $template      The template to render or an array of templates to try consecutively
 * @param array            $variables     The variables to pass to the template
 * @param bool             $withContext
 * @param bool             $ignoreMissing Whether to ignore missing templates or not
 * @param bool             $sandboxed     Whether to sandbox the template or not
 *
 * @return string The rendered template
 */
function twig_include(Twig_Environment $env, $context, $template, $variables = [], $withContext = true, $ignoreMissing = false, $sandboxed = false)
{
    $alreadySandboxed = false;
    $sandbox = null;
    if ($withContext) {
        $variables = array_merge($context, $variables);
    }

    if ($isSandboxed = $sandboxed && $env->hasExtension('Twig_Extension_Sandbox')) {
        $sandbox = $env->getExtension('Twig_Extension_Sandbox');
        if (!$alreadySandboxed = $sandbox->isSandboxed()) {
            $sandbox->enableSandbox();
        }
    }

    $result = '';
    try {
        $result = $env->resolveTemplate($template)->render($variables);
    } catch (Twig_Error_Loader $e) {
        if (!$ignoreMissing) {
            if ($isSandboxed && !$alreadySandboxed) {
                $sandbox->disableSandbox();
            }

            throw $e;
        }
    } catch (Throwable $e) {
        if ($isSandboxed && !$alreadySandboxed) {
            $sandbox->disableSandbox();
        }

        throw $e;
    }

    if ($isSandboxed && !$alreadySandboxed) {
        $sandbox->disableSandbox();
    }

    return $result;
}

/**
 * Returns a template content without rendering it.
 *
 * @param Twig_Environment $env
 * @param string           $name          The template name
 * @param bool             $ignoreMissing Whether to ignore missing templates or not
 *
 * @return string The template source
 */
function twig_source(Twig_Environment $env, $name, $ignoreMissing = false)
{
    $loader = $env->getLoader();
    try {
        return $loader->getSourceContext($name)->getCode();
    } catch (Twig_Error_Loader $e) {
        if (!$ignoreMissing) {
            throw $e;
        }
    }
}

/**
 * Provides the ability to get constants from instances as well as class/global constants.
 *
 * @param string      $constant The name of the constant
 * @param object|null $object   The object to get the constant from
 *
 * @return string
 */
function twig_constant($constant, $object = null)
{
    if (null !== $object) {
        $constant = get_class($object).'::'.$constant;
    }

    return constant($constant);
}

/**
 * Checks if a constant exists.
 *
 * @param string      $constant The name of the constant
 * @param object|null $object   The object to get the constant from
 *
 * @return bool
 */
function twig_constant_is_defined($constant, $object = null)
{
    if (null !== $object) {
        $constant = get_class($object).'::'.$constant;
    }

    return defined($constant);
}

/**
 * Batches item.
 *
 * @param array $items An array of items
 * @param int   $size  The size of the batch
 * @param mixed $fill  A value used to fill missing items
 *
 * @return array
 */
function twig_array_batch($items, $size, $fill = null)
{
    if ($items instanceof Traversable) {
        $items = iterator_to_array($items, false);
    }

    $size = ceil($size);

    $result = array_chunk($items, $size, true);

    if (null !== $fill && !empty($result)) {
        $last = count($result) - 1;
        if ($fillCount = $size - count($result[$last])) {
            $result[$last] = array_merge(
                $result[$last],
                array_fill(0, $fillCount, $fill)
            );
        }
    }

    return $result;
}

/**
 * Returns the attribute value for a given array/object.
 *
 * @param mixed  $object            The object or array from where to get the item
 * @param mixed  $item              The item to get from the array or object
 * @param array  $arguments         An array of arguments to pass if the item is an object method
 * @param string $type              The type of attribute (@see Twig_Template constants)
 * @param bool   $isDefinedTest     Whether this is only a defined check
 * @param bool   $ignoreStrictCheck Whether to ignore the strict attribute check or not
 *
 * @return mixed The attribute value, or a Boolean when $isDefinedTest is true, or null when the attribute is not set and $ignoreStrictCheck is true
 *
 * @throws Twig_Error_Runtime if the attribute does not exist and Twig is running in strict mode and $isDefinedTest is false
 *
 * @internal
 */
function twig_get_attribute(Twig_Environment $env, Twig_Source $source, $object, $item, array $arguments = [], $type = /* Twig_Template::ANY_CALL */ 'any', $isDefinedTest = false, $ignoreStrictCheck = false, $sandboxed = false)
{
    // array
    if (/* Twig_Template::METHOD_CALL */ 'method' !== $type) {
        $arrayItem = is_bool($item) || is_float($item) ? (int) $item : $item;

        if (((is_array($object) || $object instanceof ArrayObject) && (isset($object[$arrayItem]) || array_key_exists($arrayItem, $object)))
            || ($object instanceof ArrayAccess && isset($object[$arrayItem]))
        ) {
            if ($isDefinedTest) {
                return true;
            }

            return $object[$arrayItem];
        }

        if (/* Twig_Template::ARRAY_CALL */ 'array' === $type || !is_object($object)) {
            if ($isDefinedTest) {
                return false;
            }

            if ($ignoreStrictCheck || !$env->isStrictVariables()) {
                return;
            }

            if ($object instanceof ArrayAccess) {
                $message = sprintf('Key "%s" in object with ArrayAccess of class "%s" does not exist.', $arrayItem, get_class($object));
            } elseif (is_object($object)) {
                $message = sprintf('Impossible to access a key "%s" on an object of class "%s" that does not implement ArrayAccess interface.', $item, get_class($object));
            } elseif (is_array($object)) {
                if (empty($object)) {
                    $message = sprintf('Key "%s" does not exist as the array is empty.', $arrayItem);
                } else {
                    $message = sprintf('Key "%s" for array with keys "%s" does not exist.', $arrayItem, implode(', ', array_keys($object)));
                }
            } elseif (/* Twig_Template::ARRAY_CALL */ 'array' === $type) {
                if (null === $object) {
                    $message = sprintf('Impossible to access a key ("%s") on a null variable.', $item);
                } else {
                    $message = sprintf('Impossible to access a key ("%s") on a %s variable ("%s").', $item, gettype($object), $object);
                }
            } elseif (null === $object) {
                $message = sprintf('Impossible to access an attribute ("%s") on a null variable.', $item);
            } else {
                $message = sprintf('Impossible to access an attribute ("%s") on a %s variable ("%s").', $item, gettype($object), $object);
            }

            throw new Twig_Error_Runtime($message, -1, $source);
        }
    }

    if (!is_object($object)) {
        if ($isDefinedTest) {
            return false;
        }

        if ($ignoreStrictCheck || !$env->isStrictVariables()) {
            return;
        }

        if (null === $object) {
            $message = sprintf('Impossible to invoke a method ("%s") on a null variable.', $item);
        } elseif (is_array($object)) {
            $message = sprintf('Impossible to invoke a method ("%s") on an array.', $item);
        } else {
            $message = sprintf('Impossible to invoke a method ("%s") on a %s variable ("%s").', $item, gettype($object), $object);
        }

        throw new Twig_Error_Runtime($message, -1, $source);
    }

    if ($object instanceof Twig_Template) {
        throw new Twig_Error_Runtime('Accessing Twig_Template attributes is forbidden.');
    }

    // object property
    if (/* Twig_Template::METHOD_CALL */ 'method' !== $type) {
        if (isset($object->$item) || array_key_exists((string) $item, $object)) {
            if ($isDefinedTest) {
                return true;
            }

            if ($sandboxed) {
                $env->getExtension('Twig_Extension_Sandbox')->checkPropertyAllowed($object, $item);
            }

            return $object->$item;
        }
    }

    static $cache = [];

    $class = get_class($object);

    // object method
    // precedence: getXxx() > isXxx() > hasXxx()
    if (!isset($cache[$class])) {
        $methods = get_class_methods($object);
        sort($methods);
        $lcMethods = array_map('strtolower', $methods);
        $classCache = [];
        foreach ($methods as $i => $method) {
            $classCache[$method] = $method;
            $classCache[$lcName = $lcMethods[$i]] = $method;

            if ('g' === $lcName[0] && 0 === strpos($lcName, 'get')) {
                $name = substr($method, 3);
                $lcName = substr($lcName, 3);
            } elseif ('i' === $lcName[0] && 0 === strpos($lcName, 'is')) {
                $name = substr($method, 2);
                $lcName = substr($lcName, 2);
            } elseif ('h' === $lcName[0] && 0 === strpos($lcName, 'has')) {
                $name = substr($method, 3);
                $lcName = substr($lcName, 3);
                if (in_array('is'.$lcName, $lcMethods)) {
                    continue;
                }
            } else {
                continue;
            }

            // skip get() and is() methods (in which case, $name is empty)
            if ($name) {
                if (!isset($classCache[$name])) {
                    $classCache[$name] = $method;
                }

                if (!isset($classCache[$lcName])) {
                    $classCache[$lcName] = $method;
                }
            }
        }
        $cache[$class] = $classCache;
    }

    $call = false;
    if (isset($cache[$class][$item])) {
        $method = $cache[$class][$item];
    } elseif (isset($cache[$class][$lcItem = strtolower($item)])) {
        $method = $cache[$class][$lcItem];
    } elseif (isset($cache[$class]['__call'])) {
        $method = $item;
        $call = true;
    } else {
        if ($isDefinedTest) {
            return false;
        }

        if ($ignoreStrictCheck || !$env->isStrictVariables()) {
            return;
        }

        throw new Twig_Error_Runtime(sprintf('Neither the property "%1$s" nor one of the methods "%1$s()", "get%1$s()"/"is%1$s()"/"has%1$s()" or "__call()" exist and have public access in class "%2$s".', $item, $class), -1, $source);
    }

    if ($isDefinedTest) {
        return true;
    }

    if ($sandboxed) {
        $env->getExtension('Twig_Extension_Sandbox')->checkMethodAllowed($object, $method);
    }

    // Some objects throw exceptions when they have __call, and the method we try
    // to call is not supported. If ignoreStrictCheck is true, we should return null.
    try {
        $ret = $object->$method(...$arguments);
    } catch (BadMethodCallException $e) {
        if ($call && ($ignoreStrictCheck || !$env->isStrictVariables())) {
            return;
        }
        throw $e;
    }

    return $ret;
}

class_alias('Twig_Extension_Core', 'Twig\Extension\CoreExtension', false);

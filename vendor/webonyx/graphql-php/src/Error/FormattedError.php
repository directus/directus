<?php

declare(strict_types=1);

namespace GraphQL\Error;

use Countable;
use ErrorException;
use Exception;
use GraphQL\Language\AST\Node;
use GraphQL\Language\Source;
use GraphQL\Language\SourceLocation;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\WrappingType;
use GraphQL\Utils\Utils;
use Throwable;
use function addcslashes;
use function array_filter;
use function array_intersect_key;
use function array_map;
use function array_merge;
use function array_shift;
use function count;
use function get_class;
use function gettype;
use function implode;
use function is_array;
use function is_bool;
use function is_object;
use function is_scalar;
use function is_string;
use function mb_strlen;
use function preg_split;
use function sprintf;
use function str_repeat;
use function strlen;

/**
 * This class is used for [default error formatting](error-handling.md).
 * It converts PHP exceptions to [spec-compliant errors](https://facebook.github.io/graphql/#sec-Errors)
 * and provides tools for error debugging.
 */
class FormattedError
{
    /** @var string */
    private static $internalErrorMessage = 'Internal server error';

    /**
     * Set default error message for internal errors formatted using createFormattedError().
     * This value can be overridden by passing 3rd argument to `createFormattedError()`.
     *
     * @param string $msg
     *
     * @api
     */
    public static function setInternalErrorMessage($msg)
    {
        self::$internalErrorMessage = $msg;
    }

    /**
     * Prints a GraphQLError to a string, representing useful location information
     * about the error's position in the source.
     *
     * @return string
     */
    public static function printError(Error $error)
    {
        $printedLocations = [];
        if ($error->nodes) {
            /** @var Node $node */
            foreach ($error->nodes as $node) {
                if (! $node->loc) {
                    continue;
                }

                if ($node->loc->source === null) {
                    continue;
                }

                $printedLocations[] = self::highlightSourceAtLocation(
                    $node->loc->source,
                    $node->loc->source->getLocation($node->loc->start)
                );
            }
        } elseif ($error->getSource() && $error->getLocations()) {
            $source = $error->getSource();
            foreach ($error->getLocations() as $location) {
                $printedLocations[] = self::highlightSourceAtLocation($source, $location);
            }
        }

        return ! $printedLocations
            ? $error->getMessage()
            : implode("\n\n", array_merge([$error->getMessage()], $printedLocations)) . "\n";
    }

    /**
     * Render a helpful description of the location of the error in the GraphQL
     * Source document.
     *
     * @return string
     */
    private static function highlightSourceAtLocation(Source $source, SourceLocation $location)
    {
        $line          = $location->line;
        $lineOffset    = $source->locationOffset->line - 1;
        $columnOffset  = self::getColumnOffset($source, $location);
        $contextLine   = $line + $lineOffset;
        $contextColumn = $location->column + $columnOffset;
        $prevLineNum   = (string) ($contextLine - 1);
        $lineNum       = (string) $contextLine;
        $nextLineNum   = (string) ($contextLine + 1);
        $padLen        = strlen($nextLineNum);
        $lines         = preg_split('/\r\n|[\n\r]/', $source->body);

        $lines[0] = self::whitespace($source->locationOffset->column - 1) . $lines[0];

        $outputLines = [
            sprintf('%s (%s:%s)', $source->name, $contextLine, $contextColumn),
            $line >= 2 ? (self::lpad($padLen, $prevLineNum) . ': ' . $lines[$line - 2]) : null,
            self::lpad($padLen, $lineNum) . ': ' . $lines[$line - 1],
            self::whitespace(2 + $padLen + $contextColumn - 1) . '^',
            $line < count($lines) ? self::lpad($padLen, $nextLineNum) . ': ' . $lines[$line] : null,
        ];

        return implode("\n", array_filter($outputLines));
    }

    /**
     * @return int
     */
    private static function getColumnOffset(Source $source, SourceLocation $location)
    {
        return $location->line === 1 ? $source->locationOffset->column - 1 : 0;
    }

    /**
     * @param int $len
     *
     * @return string
     */
    private static function whitespace($len)
    {
        return str_repeat(' ', $len);
    }

    /**
     * @param int $len
     *
     * @return string
     */
    private static function lpad($len, $str)
    {
        return self::whitespace($len - mb_strlen($str)) . $str;
    }

    /**
     * Standard GraphQL error formatter. Converts any exception to array
     * conforming to GraphQL spec.
     *
     * This method only exposes exception message when exception implements ClientAware interface
     * (or when debug flags are passed).
     *
     * For a list of available debug flags see GraphQL\Error\Debug constants.
     *
     * @param Throwable $e
     * @param bool|int  $debug
     * @param string    $internalErrorMessage
     *
     * @return mixed[]
     *
     * @throws Throwable
     *
     * @api
     */
    public static function createFromException($e, $debug = false, $internalErrorMessage = null)
    {
        Utils::invariant(
            $e instanceof Exception || $e instanceof Throwable,
            'Expected exception, got %s',
            Utils::getVariableType($e)
        );

        $internalErrorMessage = $internalErrorMessage ?: self::$internalErrorMessage;

        if ($e instanceof ClientAware) {
            $formattedError = [
                'message'  => $e->isClientSafe() ? $e->getMessage() : $internalErrorMessage,
                'extensions' => [
                    'category' => $e->getCategory(),
                ],
            ];
        } else {
            $formattedError = [
                'message'  => $internalErrorMessage,
                'extensions' => [
                    'category' => Error::CATEGORY_INTERNAL,
                ],
            ];
        }

        if ($e instanceof Error) {
            $locations = Utils::map(
                $e->getLocations(),
                static function (SourceLocation $loc) {
                    return $loc->toSerializableArray();
                }
            );
            if (! empty($locations)) {
                $formattedError['locations'] = $locations;
            }
            if (! empty($e->path)) {
                $formattedError['path'] = $e->path;
            }
            if (! empty($e->getExtensions())) {
                $formattedError['extensions'] = $e->getExtensions() + $formattedError['extensions'];
            }
        }

        if ($debug) {
            $formattedError = self::addDebugEntries($formattedError, $e, $debug);
        }

        return $formattedError;
    }

    /**
     * Decorates spec-compliant $formattedError with debug entries according to $debug flags
     * (see GraphQL\Error\Debug for available flags)
     *
     * @param mixed[]   $formattedError
     * @param Throwable $e
     * @param bool|int  $debug
     *
     * @return mixed[]
     *
     * @throws Throwable
     */
    public static function addDebugEntries(array $formattedError, $e, $debug)
    {
        if (! $debug) {
            return $formattedError;
        }

        Utils::invariant(
            $e instanceof Exception || $e instanceof Throwable,
            'Expected exception, got %s',
            Utils::getVariableType($e)
        );

        $debug = (int) $debug;

        if ($debug & Debug::RETHROW_INTERNAL_EXCEPTIONS) {
            if (! $e instanceof Error) {
                throw $e;
            }

            if ($e->getPrevious()) {
                throw $e->getPrevious();
            }
        }

        $isUnsafe = ! $e instanceof ClientAware || ! $e->isClientSafe();

        if (($debug & Debug::RETHROW_UNSAFE_EXCEPTIONS) && $isUnsafe) {
            if ($e->getPrevious()) {
                throw $e->getPrevious();
            }
        }

        if (($debug & Debug::INCLUDE_DEBUG_MESSAGE) && $isUnsafe) {
            // Displaying debugMessage as a first entry:
            $formattedError = ['debugMessage' => $e->getMessage()] + $formattedError;
        }

        if ($debug & Debug::INCLUDE_TRACE) {
            if ($e instanceof ErrorException || $e instanceof \Error) {
                $formattedError += [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ];
            }

            $isTrivial = $e instanceof Error && ! $e->getPrevious();

            if (! $isTrivial) {
                $debugging               = $e->getPrevious() ?: $e;
                $formattedError['trace'] = static::toSafeTrace($debugging);
            }
        }

        return $formattedError;
    }

    /**
     * Prepares final error formatter taking in account $debug flags.
     * If initial formatter is not set, FormattedError::createFromException is used
     *
     * @param  bool|int $debug
     *
     * @return callable|callable
     */
    public static function prepareFormatter(?callable $formatter = null, $debug)
    {
        $formatter = $formatter ?: static function ($e) {
            return FormattedError::createFromException($e);
        };
        if ($debug) {
            $formatter = static function ($e) use ($formatter, $debug) {
                return FormattedError::addDebugEntries($formatter($e), $e, $debug);
            };
        }

        return $formatter;
    }

    /**
     * Returns error trace as serializable array
     *
     * @param Throwable $error
     *
     * @return mixed[]
     *
     * @api
     */
    public static function toSafeTrace($error)
    {
        $trace = $error->getTrace();

        if (isset($trace[0]['function']) && isset($trace[0]['class']) &&
            // Remove invariant entries as they don't provide much value:
            ($trace[0]['class'] . '::' . $trace[0]['function'] === 'GraphQL\Utils\Utils::invariant')) {
            array_shift($trace);
        } elseif (! isset($trace[0]['file'])) {
            // Remove root call as it's likely error handler trace:
            array_shift($trace);
        }

        return array_map(
            static function ($err) {
                $safeErr = array_intersect_key($err, ['file' => true, 'line' => true]);

                if (isset($err['function'])) {
                    $func    = $err['function'];
                    $args    = ! empty($err['args']) ? array_map([self::class, 'printVar'], $err['args']) : [];
                    $funcStr = $func . '(' . implode(', ', $args) . ')';

                    if (isset($err['class'])) {
                        $safeErr['call'] = $err['class'] . '::' . $funcStr;
                    } else {
                        $safeErr['function'] = $funcStr;
                    }
                }

                return $safeErr;
            },
            $trace
        );
    }

    /**
     * @param mixed $var
     *
     * @return string
     */
    public static function printVar($var)
    {
        if ($var instanceof Type) {
            // FIXME: Replace with schema printer call
            if ($var instanceof WrappingType) {
                $var = $var->getWrappedType(true);
            }

            return 'GraphQLType: ' . $var->name;
        }

        if (is_object($var)) {
            return 'instance of ' . get_class($var) . ($var instanceof Countable ? '(' . count($var) . ')' : '');
        }
        if (is_array($var)) {
            return 'array(' . count($var) . ')';
        }
        if ($var === '') {
            return '(empty string)';
        }
        if (is_string($var)) {
            return "'" . addcslashes($var, "'") . "'";
        }
        if (is_bool($var)) {
            return $var ? 'true' : 'false';
        }
        if (is_scalar($var)) {
            return $var;
        }
        if ($var === null) {
            return 'null';
        }

        return gettype($var);
    }

    /**
     * @deprecated as of v0.8.0
     *
     * @param string           $error
     * @param SourceLocation[] $locations
     *
     * @return mixed[]
     */
    public static function create($error, array $locations = [])
    {
        $formatted = ['message' => $error];

        if (! empty($locations)) {
            $formatted['locations'] = array_map(
                static function ($loc) {
                    return $loc->toArray();
                },
                $locations
            );
        }

        return $formatted;
    }

    /**
     * @deprecated as of v0.10.0, use general purpose method createFromException() instead
     *
     * @return mixed[]
     */
    public static function createFromPHPError(ErrorException $e)
    {
        return [
            'message'  => $e->getMessage(),
            'severity' => $e->getSeverity(),
            'trace'    => self::toSafeTrace($e),
        ];
    }
}

<?php

declare(strict_types=1);

namespace GraphQL\Error;

use Exception;
use GraphQL\Language\AST\Node;
use GraphQL\Language\Source;
use GraphQL\Language\SourceLocation;
use GraphQL\Utils\Utils;
use JsonSerializable;
use Throwable;
use Traversable;
use function array_filter;
use function array_map;
use function array_values;
use function is_array;
use function iterator_to_array;

/**
 * Describes an Error found during the parse, validate, or
 * execute phases of performing a GraphQL operation. In addition to a message
 * and stack trace, it also includes information about the locations in a
 * GraphQL document and/or execution result that correspond to the Error.
 *
 * When the error was caused by an exception thrown in resolver, original exception
 * is available via `getPrevious()`.
 *
 * Also read related docs on [error handling](error-handling.md)
 *
 * Class extends standard PHP `\Exception`, so all standard methods of base `\Exception` class
 * are available in addition to those listed below.
 */
class Error extends Exception implements JsonSerializable, ClientAware
{
    const CATEGORY_GRAPHQL  = 'graphql';
    const CATEGORY_INTERNAL = 'internal';

    /**
     * A message describing the Error for debugging purposes.
     *
     * @var string
     */
    public $message;

    /** @var SourceLocation[] */
    private $locations;

    /**
     * An array describing the JSON-path into the execution response which
     * corresponds to this error. Only included for errors during execution.
     *
     * @var mixed[]|null
     */
    public $path;

    /**
     * An array of GraphQL AST Nodes corresponding to this error.
     *
     * @var Node[]|null
     */
    public $nodes;

    /**
     * The source GraphQL document for the first location of this error.
     *
     * Note that if this Error represents more than one node, the source may not
     * represent nodes after the first node.
     *
     * @var Source|null
     */
    private $source;

    /** @var int[]|null */
    private $positions;

    /** @var bool */
    private $isClientSafe;

    /** @var string */
    protected $category;

    /** @var mixed[]|null */
    protected $extensions;

    /**
     * @param string                       $message
     * @param Node|Node[]|Traversable|null $nodes
     * @param mixed[]|null                 $positions
     * @param mixed[]|null                 $path
     * @param Throwable                    $previous
     * @param mixed[]                      $extensions
     */
    public function __construct(
        $message,
        $nodes = null,
        ?Source $source = null,
        $positions = null,
        $path = null,
        $previous = null,
        array $extensions = []
    ) {
        parent::__construct($message, 0, $previous);

        // Compute list of blame nodes.
        if ($nodes instanceof Traversable) {
            $nodes = iterator_to_array($nodes);
        } elseif ($nodes && ! is_array($nodes)) {
            $nodes = [$nodes];
        }

        $this->nodes      = $nodes;
        $this->source     = $source;
        $this->positions  = $positions;
        $this->path       = $path;
        $this->extensions = $extensions ?: (
        $previous && $previous instanceof self
            ? $previous->extensions
            : []
        );

        if ($previous instanceof ClientAware) {
            $this->isClientSafe = $previous->isClientSafe();
            $this->category     = $previous->getCategory() ?: self::CATEGORY_INTERNAL;
        } elseif ($previous) {
            $this->isClientSafe = false;
            $this->category     = self::CATEGORY_INTERNAL;
        } else {
            $this->isClientSafe = true;
            $this->category     = self::CATEGORY_GRAPHQL;
        }
    }

    /**
     * Given an arbitrary Error, presumably thrown while attempting to execute a
     * GraphQL operation, produce a new GraphQLError aware of the location in the
     * document responsible for the original Error.
     *
     * @param mixed        $error
     * @param Node[]|null  $nodes
     * @param mixed[]|null $path
     *
     * @return Error
     */
    public static function createLocatedError($error, $nodes = null, $path = null)
    {
        if ($error instanceof self) {
            if ($error->path && $error->nodes) {
                return $error;
            }

            $nodes = $nodes ?: $error->nodes;
            $path  = $path ?: $error->path;
        }

        $source     = $positions = $originalError = null;
        $extensions = [];

        if ($error instanceof self) {
            $message       = $error->getMessage();
            $originalError = $error;
            $nodes         = $error->nodes ?: $nodes;
            $source        = $error->source;
            $positions     = $error->positions;
            $extensions    = $error->extensions;
        } elseif ($error instanceof Exception || $error instanceof Throwable) {
            $message       = $error->getMessage();
            $originalError = $error;
        } else {
            $message = (string) $error;
        }

        return new static(
            $message ?: 'An unknown error occurred.',
            $nodes,
            $source,
            $positions,
            $path,
            $originalError,
            $extensions
        );
    }

    /**
     * @return mixed[]
     */
    public static function formatError(Error $error)
    {
        return $error->toSerializableArray();
    }

    /**
     * @inheritdoc
     */
    public function isClientSafe()
    {
        return $this->isClientSafe;
    }

    /**
     * @inheritdoc
     */
    public function getCategory()
    {
        return $this->category;
    }

    /**
     * @return Source|null
     */
    public function getSource()
    {
        if ($this->source === null) {
            if (! empty($this->nodes[0]) && ! empty($this->nodes[0]->loc)) {
                $this->source = $this->nodes[0]->loc->source;
            }
        }

        return $this->source;
    }

    /**
     * @return int[]
     */
    public function getPositions()
    {
        if ($this->positions === null && ! empty($this->nodes)) {
            $positions = array_map(
                static function ($node) {
                    return isset($node->loc) ? $node->loc->start : null;
                },
                $this->nodes
            );

            $positions = array_filter(
                $positions,
                static function ($p) {
                    return $p !== null;
                }
            );

            $this->positions = array_values($positions);
        }

        return $this->positions;
    }

    /**
     * An array of locations within the source GraphQL document which correspond to this error.
     *
     * Each entry has information about `line` and `column` within source GraphQL document:
     * $location->line;
     * $location->column;
     *
     * Errors during validation often contain multiple locations, for example to
     * point out to field mentioned in multiple fragments. Errors during execution include a
     * single location, the field which produced the error.
     *
     * @return SourceLocation[]
     *
     * @api
     */
    public function getLocations()
    {
        if ($this->locations === null) {
            $positions = $this->getPositions();
            $source    = $this->getSource();
            $nodes     = $this->nodes;

            if ($positions && $source) {
                $this->locations = array_map(
                    static function ($pos) use ($source) {
                        return $source->getLocation($pos);
                    },
                    $positions
                );
            } elseif ($nodes) {
                $locations       = array_filter(
                    array_map(
                        static function ($node) {
                            if ($node->loc && $node->loc->source) {
                                return $node->loc->source->getLocation($node->loc->start);
                            }
                        },
                        $nodes
                    )
                );
                $this->locations = array_values($locations);
            } else {
                $this->locations = [];
            }
        }

        return $this->locations;
    }

    /**
     * @return Node[]|null
     */
    public function getNodes()
    {
        return $this->nodes;
    }

    /**
     * Returns an array describing the path from the root value to the field which produced this error.
     * Only included for execution errors.
     *
     * @return mixed[]|null
     *
     * @api
     */
    public function getPath()
    {
        return $this->path;
    }

    /**
     * @return mixed[]
     */
    public function getExtensions()
    {
        return $this->extensions;
    }

    /**
     * Returns array representation of error suitable for serialization
     *
     * @deprecated Use FormattedError::createFromException() instead
     *
     * @return mixed[]
     */
    public function toSerializableArray()
    {
        $arr = [
            'message' => $this->getMessage(),
        ];

        $locations = Utils::map(
            $this->getLocations(),
            static function (SourceLocation $loc) {
                return $loc->toSerializableArray();
            }
        );

        if (! empty($locations)) {
            $arr['locations'] = $locations;
        }
        if (! empty($this->path)) {
            $arr['path'] = $this->path;
        }
        if (! empty($this->extensions)) {
            $arr['extensions'] = $this->extensions;
        }

        return $arr;
    }

    /**
     * Specify data which should be serialized to JSON
     *
     * @link http://php.net/manual/en/jsonserializable.jsonserialize.php
     *
     * @return mixed data which can be serialized by <b>json_encode</b>,
     * which is a value of any type other than a resource.
     */
    public function jsonSerialize()
    {
        return $this->toSerializableArray();
    }

    /**
     * @return string
     */
    public function __toString()
    {
        return FormattedError::printError($this);
    }
}

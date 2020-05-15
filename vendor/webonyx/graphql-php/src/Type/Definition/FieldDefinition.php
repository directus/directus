<?php

declare(strict_types=1);

namespace GraphQL\Type\Definition;

use GraphQL\Error\Error;
use GraphQL\Error\InvariantViolation;
use GraphQL\Language\AST\FieldDefinitionNode;
use GraphQL\Utils\Utils;
use function is_array;
use function is_callable;
use function is_string;
use function sprintf;

/**
 * @todo Move complexity-related code to it's own place
 */
class FieldDefinition
{
    public const DEFAULT_COMPLEXITY_FN = 'GraphQL\Type\Definition\FieldDefinition::defaultComplexity';

    /** @var string */
    public $name;

    /** @var FieldArgument[] */
    public $args;

    /**
     * Callback for resolving field value given parent value.
     * Mutually exclusive with `map`
     *
     * @var callable
     */
    public $resolveFn;

    /**
     * Callback for mapping list of parent values to list of field values.
     * Mutually exclusive with `resolve`
     *
     * @var callable
     */
    public $mapFn;

    /** @var string|null */
    public $description;

    /** @var string|null */
    public $deprecationReason;

    /** @var FieldDefinitionNode|null */
    public $astNode;

    /**
     * Original field definition config
     *
     * @var mixed[]
     */
    public $config;

    /** @var OutputType */
    public $type;

    /** @var callable|string */
    private $complexityFn;

    /**
     * @param mixed[] $config
     */
    protected function __construct(array $config)
    {
        $this->name      = $config['name'];
        $this->type      = $config['type'];
        $this->resolveFn = $config['resolve'] ?? null;
        $this->mapFn     = $config['map'] ?? null;
        $this->args      = isset($config['args']) ? FieldArgument::createMap($config['args']) : [];

        $this->description       = $config['description'] ?? null;
        $this->deprecationReason = $config['deprecationReason'] ?? null;
        $this->astNode           = $config['astNode'] ?? null;

        $this->config = $config;

        $this->complexityFn = $config['complexity'] ?? self::DEFAULT_COMPLEXITY_FN;
    }

    public static function defineFieldMap(Type $type, $fields)
    {
        if (is_callable($fields)) {
            $fields = $fields();
        }
        if (! is_array($fields)) {
            throw new InvariantViolation(
                sprintf('%s fields must be an array or a callable which returns such an array.', $type->name)
            );
        }
        $map = [];
        foreach ($fields as $name => $field) {
            if (is_array($field)) {
                if (! isset($field['name'])) {
                    if (! is_string($name)) {
                        throw new InvariantViolation(
                            sprintf(
                                '%s fields must be an associative array with field names as keys or a function which returns such an array.',
                                $type->name
                            )
                        );
                    }

                    $field['name'] = $name;
                }
                if (isset($field['args']) && ! is_array($field['args'])) {
                    throw new InvariantViolation(
                        sprintf('%s.%s args must be an array.', $type->name, $name)
                    );
                }
                $fieldDef = self::create($field);
            } elseif ($field instanceof self) {
                $fieldDef = $field;
            } else {
                if (! is_string($name) || ! $field) {
                    throw new InvariantViolation(
                        sprintf(
                            '%s.%s field config must be an array, but got: %s',
                            $type->name,
                            $name,
                            Utils::printSafe($field)
                        )
                    );
                }

                $fieldDef = self::create(['name' => $name, 'type' => $field]);
            }
            $map[$fieldDef->name] = $fieldDef;
        }

        return $map;
    }

    /**
     * @param mixed[] $field
     *
     * @return FieldDefinition
     */
    public static function create($field)
    {
        return new self($field);
    }

    /**
     * @param int $childrenComplexity
     *
     * @return mixed
     */
    public static function defaultComplexity($childrenComplexity)
    {
        return $childrenComplexity + 1;
    }

    /**
     * @param string $name
     *
     * @return FieldArgument|null
     */
    public function getArg($name)
    {
        foreach ($this->args ?: [] as $arg) {
            /** @var FieldArgument $arg */
            if ($arg->name === $name) {
                return $arg;
            }
        }

        return null;
    }

    /**
     * @return Type
     */
    public function getType()
    {
        return $this->type;
    }

    /**
     * @return bool
     */
    public function isDeprecated()
    {
        return (bool) $this->deprecationReason;
    }

    /**
     * @return callable|callable
     */
    public function getComplexityFn()
    {
        return $this->complexityFn;
    }

    /**
     * @throws InvariantViolation
     */
    public function assertValid(Type $parentType)
    {
        try {
            Utils::assertValidName($this->name);
        } catch (Error $e) {
            throw new InvariantViolation(sprintf('%s.%s: %s', $parentType->name, $this->name, $e->getMessage()));
        }
        Utils::invariant(
            ! isset($this->config['isDeprecated']),
            sprintf(
                '%s.%s should provide "deprecationReason" instead of "isDeprecated".',
                $parentType->name,
                $this->name
            )
        );

        $type = $this->type;
        if ($type instanceof WrappingType) {
            $type = $type->getWrappedType(true);
        }
        Utils::invariant(
            $type instanceof OutputType,
            sprintf(
                '%s.%s field type must be Output Type but got: %s',
                $parentType->name,
                $this->name,
                Utils::printSafe($this->type)
            )
        );
        Utils::invariant(
            $this->resolveFn === null || is_callable($this->resolveFn),
            sprintf(
                '%s.%s field resolver must be a function if provided, but got: %s',
                $parentType->name,
                $this->name,
                Utils::printSafe($this->resolveFn)
            )
        );
    }
}

<?php

declare(strict_types=1);

namespace GraphQL\Type\Definition;

use GraphQL\Error\InvariantViolation;
use GraphQL\Language\AST\UnionTypeDefinitionNode;
use GraphQL\Language\AST\UnionTypeExtensionNode;
use GraphQL\Utils\Utils;
use function call_user_func;
use function is_array;
use function is_callable;
use function is_string;
use function sprintf;

class UnionType extends Type implements AbstractType, OutputType, CompositeType, NullableType, NamedType
{
    /** @var UnionTypeDefinitionNode */
    public $astNode;

    /** @var ObjectType[] */
    private $types;

    /** @var ObjectType[] */
    private $possibleTypeNames;

    /** @var UnionTypeExtensionNode[] */
    public $extensionASTNodes;

    public function __construct($config)
    {
        if (! isset($config['name'])) {
            $config['name'] = $this->tryInferName();
        }

        Utils::invariant(is_string($config['name']), 'Must provide name.');

        /**
         * Optionally provide a custom type resolver function. If one is not provided,
         * the default implemenation will call `isTypeOf` on each implementing
         * Object type.
         */
        $this->name              = $config['name'];
        $this->description       = $config['description'] ?? null;
        $this->astNode           = $config['astNode'] ?? null;
        $this->extensionASTNodes = $config['extensionASTNodes'] ?? null;
        $this->config            = $config;
    }

    public function isPossibleType(Type $type) : bool
    {
        if (! $type instanceof ObjectType) {
            return false;
        }

        if ($this->possibleTypeNames === null) {
            $this->possibleTypeNames = [];
            foreach ($this->getTypes() as $possibleType) {
                $this->possibleTypeNames[$possibleType->name] = true;
            }
        }

        return isset($this->possibleTypeNames[$type->name]);
    }

    /**
     * @return ObjectType[]
     */
    public function getTypes()
    {
        if ($this->types === null) {
            if (! isset($this->config['types'])) {
                $types = null;
            } elseif (is_callable($this->config['types'])) {
                $types = call_user_func($this->config['types']);
            } else {
                $types = $this->config['types'];
            }

            if (! is_array($types)) {
                throw new InvariantViolation(
                    sprintf(
                        'Must provide Array of types or a callable which returns such an array for Union %s',
                        $this->name
                    )
                );
            }

            $this->types = $types;
        }

        return $this->types;
    }

    /**
     * Resolves concrete ObjectType for given object value
     *
     * @param object $objectValue
     * @param mixed  $context
     *
     * @return callable|null
     */
    public function resolveType($objectValue, $context, ResolveInfo $info)
    {
        if (isset($this->config['resolveType'])) {
            $fn = $this->config['resolveType'];

            return $fn($objectValue, $context, $info);
        }

        return null;
    }

    /**
     * @throws InvariantViolation
     */
    public function assertValid()
    {
        parent::assertValid();

        if (! isset($this->config['resolveType'])) {
            return;
        }

        Utils::invariant(
            is_callable($this->config['resolveType']),
            sprintf(
                '%s must provide "resolveType" as a function, but got: %s',
                $this->name,
                Utils::printSafe($this->config['resolveType'])
            )
        );
    }
}

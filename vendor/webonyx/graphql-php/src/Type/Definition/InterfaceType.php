<?php

declare(strict_types=1);

namespace GraphQL\Type\Definition;

use GraphQL\Error\InvariantViolation;
use GraphQL\Language\AST\InterfaceTypeDefinitionNode;
use GraphQL\Language\AST\InterfaceTypeExtensionNode;
use GraphQL\Utils\Utils;
use function is_callable;
use function is_string;
use function sprintf;

class InterfaceType extends Type implements AbstractType, OutputType, CompositeType, NullableType, NamedType
{
    /** @var InterfaceTypeDefinitionNode|null */
    public $astNode;

    /** @var InterfaceTypeExtensionNode[] */
    public $extensionASTNodes;

    /** @var FieldDefinition[] */
    private $fields;

    /**
     * @param mixed[] $config
     */
    public function __construct(array $config)
    {
        if (! isset($config['name'])) {
            $config['name'] = $this->tryInferName();
        }

        Utils::invariant(is_string($config['name']), 'Must provide name.');

        $this->name              = $config['name'];
        $this->description       = $config['description'] ?? null;
        $this->astNode           = $config['astNode'] ?? null;
        $this->extensionASTNodes = $config['extensionASTNodes'] ?? null;
        $this->config            = $config;
    }

    /**
     * @param mixed $type
     *
     * @return self
     */
    public static function assertInterfaceType($type)
    {
        Utils::invariant(
            $type instanceof self,
            'Expected ' . Utils::printSafe($type) . ' to be a GraphQL Interface type.'
        );

        return $type;
    }

    /**
     * @param string $name
     *
     * @return FieldDefinition
     */
    public function getField($name)
    {
        if ($this->fields === null) {
            $this->getFields();
        }
        Utils::invariant(isset($this->fields[$name]), 'Field "%s" is not defined for type "%s"', $name, $this->name);

        return $this->fields[$name];
    }

    /**
     * @param string $name
     *
     * @return bool
     */
    public function hasField($name)
    {
        if ($this->fields === null) {
            $this->getFields();
        }

        return isset($this->fields[$name]);
    }

    /**
     * @return FieldDefinition[]
     */
    public function getFields()
    {
        if ($this->fields === null) {
            $fields       = $this->config['fields'] ?? [];
            $this->fields = FieldDefinition::defineFieldMap($this, $fields);
        }

        return $this->fields;
    }

    /**
     * Resolves concrete ObjectType for given object value
     *
     * @param object  $objectValue
     * @param mixed[] $context
     *
     * @return Type|null
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

        $resolveType = $this->config['resolveType'] ?? null;

        Utils::invariant(
            ! isset($resolveType) || is_callable($resolveType),
            sprintf(
                '%s must provide "resolveType" as a function, but got: %s',
                $this->name,
                Utils::printSafe($resolveType)
            )
        );
    }
}

<?php

declare(strict_types=1);

namespace GraphQL\Type\Definition;

use Exception;
use GraphQL\Error\InvariantViolation;
use GraphQL\Language\AST\ObjectTypeDefinitionNode;
use GraphQL\Language\AST\ObjectTypeExtensionNode;
use GraphQL\Utils\Utils;
use function call_user_func;
use function is_array;
use function is_callable;
use function is_string;
use function sprintf;

/**
 * Object Type Definition
 *
 * Almost all of the GraphQL types you define will be object types. Object types
 * have a name, but most importantly describe their fields.
 *
 * Example:
 *
 *     $AddressType = new ObjectType([
 *       'name' => 'Address',
 *       'fields' => [
 *         'street' => [ 'type' => GraphQL\Type\Definition\Type::string() ],
 *         'number' => [ 'type' => GraphQL\Type\Definition\Type::int() ],
 *         'formatted' => [
 *           'type' => GraphQL\Type\Definition\Type::string(),
 *           'resolve' => function($obj) {
 *             return $obj->number . ' ' . $obj->street;
 *           }
 *         ]
 *       ]
 *     ]);
 *
 * When two types need to refer to each other, or a type needs to refer to
 * itself in a field, you can use a function expression (aka a closure or a
 * thunk) to supply the fields lazily.
 *
 * Example:
 *
 *     $PersonType = null;
 *     $PersonType = new ObjectType([
 *       'name' => 'Person',
 *       'fields' => function() use (&$PersonType) {
 *          return [
 *              'name' => ['type' => GraphQL\Type\Definition\Type::string() ],
 *              'bestFriend' => [ 'type' => $PersonType ],
 *          ];
 *        }
 *     ]);
 */
class ObjectType extends Type implements OutputType, CompositeType, NullableType, NamedType
{
    /** @var ObjectTypeDefinitionNode|null */
    public $astNode;

    /** @var ObjectTypeExtensionNode[] */
    public $extensionASTNodes;

    /** @var callable */
    public $resolveFieldFn;

    /** @var FieldDefinition[] */
    private $fields;

    /** @var InterfaceType[] */
    private $interfaces;

    /** @var InterfaceType[]|null */
    private $interfaceMap;

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
        $this->resolveFieldFn    = $config['resolveField'] ?? null;
        $this->astNode           = $config['astNode'] ?? null;
        $this->extensionASTNodes = $config['extensionASTNodes'] ?? [];
        $this->config            = $config;
    }

    /**
     * @param mixed $type
     *
     * @return self
     */
    public static function assertObjectType($type)
    {
        Utils::invariant(
            $type instanceof self,
            'Expected ' . Utils::printSafe($type) . ' to be a GraphQL Object type.'
        );

        return $type;
    }

    /**
     * @param string $name
     *
     * @return FieldDefinition
     *
     * @throws Exception
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
     *
     * @throws InvariantViolation
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
     * @param InterfaceType $iface
     *
     * @return bool
     */
    public function implementsInterface($iface)
    {
        $map = $this->getInterfaceMap();

        return isset($map[$iface->name]);
    }

    private function getInterfaceMap()
    {
        if (! $this->interfaceMap) {
            $this->interfaceMap = [];
            foreach ($this->getInterfaces() as $interface) {
                $this->interfaceMap[$interface->name] = $interface;
            }
        }

        return $this->interfaceMap;
    }

    /**
     * @return InterfaceType[]
     */
    public function getInterfaces()
    {
        if ($this->interfaces === null) {
            $interfaces = $this->config['interfaces'] ?? [];
            $interfaces = is_callable($interfaces) ? call_user_func($interfaces) : $interfaces;

            if ($interfaces !== null && ! is_array($interfaces)) {
                throw new InvariantViolation(
                    sprintf('%s interfaces must be an Array or a callable which returns an Array.', $this->name)
                );
            }

            $this->interfaces = $interfaces ?: [];
        }

        return $this->interfaces;
    }

    /**
     * @param mixed[]      $value
     * @param mixed[]|null $context
     *
     * @return bool|null
     */
    public function isTypeOf($value, $context, ResolveInfo $info)
    {
        return isset($this->config['isTypeOf']) ? call_user_func(
            $this->config['isTypeOf'],
            $value,
            $context,
            $info
        ) : null;
    }

    /**
     * Validates type config and throws if one of type options is invalid.
     * Note: this method is shallow, it won't validate object fields and their arguments.
     *
     * @throws InvariantViolation
     */
    public function assertValid()
    {
        parent::assertValid();

        Utils::invariant(
            $this->description === null || is_string($this->description),
            sprintf(
                '%s description must be string if set, but it is: %s',
                $this->name,
                Utils::printSafe($this->description)
            )
        );

        $isTypeOf = $this->config['isTypeOf'] ?? null;

        Utils::invariant(
            $isTypeOf === null || is_callable($isTypeOf),
            sprintf('%s must provide "isTypeOf" as a function, but got: %s', $this->name, Utils::printSafe($isTypeOf))
        );

        foreach ($this->getFields() as $field) {
            $field->assertValid($this);
        }
    }
}

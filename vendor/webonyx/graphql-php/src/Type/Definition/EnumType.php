<?php

declare(strict_types=1);

namespace GraphQL\Type\Definition;

use ArrayObject;
use Exception;
use GraphQL\Error\Error;
use GraphQL\Error\InvariantViolation;
use GraphQL\Language\AST\EnumTypeDefinitionNode;
use GraphQL\Language\AST\EnumTypeExtensionNode;
use GraphQL\Language\AST\EnumValueNode;
use GraphQL\Language\AST\Node;
use GraphQL\Utils\MixedStore;
use GraphQL\Utils\Utils;
use function is_array;
use function is_int;
use function is_string;
use function sprintf;

class EnumType extends Type implements InputType, OutputType, LeafType, NullableType, NamedType
{
    /** @var EnumTypeDefinitionNode|null */
    public $astNode;

    /** @var EnumValueDefinition[] */
    private $values;

    /** @var MixedStore<mixed, EnumValueDefinition> */
    private $valueLookup;

    /** @var ArrayObject<string, EnumValueDefinition> */
    private $nameLookup;

    /** @var EnumTypeExtensionNode[] */
    public $extensionASTNodes;

    public function __construct($config)
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
     * @param string|mixed[] $name
     *
     * @return EnumValueDefinition|null
     */
    public function getValue($name)
    {
        $lookup = $this->getNameLookup();

        if (! is_string($name)) {
            return null;
        }

        return $lookup[$name] ?? null;
    }

    /**
     * @return ArrayObject<string, EnumValueDefinition>
     */
    private function getNameLookup()
    {
        if (! $this->nameLookup) {
            $lookup = new ArrayObject();
            foreach ($this->getValues() as $value) {
                $lookup[$value->name] = $value;
            }
            $this->nameLookup = $lookup;
        }

        return $this->nameLookup;
    }

    /**
     * @return EnumValueDefinition[]
     */
    public function getValues()
    {
        if ($this->values === null) {
            $this->values = [];
            $config       = $this->config;

            if (isset($config['values'])) {
                if (! is_array($config['values'])) {
                    throw new InvariantViolation(sprintf('%s values must be an array', $this->name));
                }
                foreach ($config['values'] as $name => $value) {
                    if (is_string($name)) {
                        if (is_array($value)) {
                            $value += ['name' => $name, 'value' => $name];
                        } else {
                            $value = ['name' => $name, 'value' => $value];
                        }
                    } elseif (is_int($name) && is_string($value)) {
                        $value = ['name' => $value, 'value' => $value];
                    } else {
                        throw new InvariantViolation(
                            sprintf(
                                '%s values must be an array with value names as keys.',
                                $this->name
                            )
                        );
                    }
                    $this->values[] = new EnumValueDefinition($value);
                }
            }
        }

        return $this->values;
    }

    /**
     * @param mixed $value
     *
     * @return mixed
     *
     * @throws Error
     */
    public function serialize($value)
    {
        $lookup = $this->getValueLookup();
        if (isset($lookup[$value])) {
            return $lookup[$value]->name;
        }

        throw new Error('Cannot serialize value as enum: ' . Utils::printSafe($value));
    }

    /**
     * @return MixedStore<mixed, EnumValueDefinition>
     */
    private function getValueLookup()
    {
        if ($this->valueLookup === null) {
            $this->valueLookup = new MixedStore();

            foreach ($this->getValues() as $valueName => $value) {
                $this->valueLookup->offsetSet($value->value, $value);
            }
        }

        return $this->valueLookup;
    }

    /**
     * @param mixed $value
     *
     * @return mixed
     *
     * @throws Error
     */
    public function parseValue($value)
    {
        $lookup = $this->getNameLookup();
        if (isset($lookup[$value])) {
            return $lookup[$value]->value;
        }

        throw new Error('Cannot represent value as enum: ' . Utils::printSafe($value));
    }

    /**
     * @param Node         $valueNode
     * @param mixed[]|null $variables
     *
     * @return null
     *
     * @throws Exception
     */
    public function parseLiteral($valueNode, ?array $variables = null)
    {
        if ($valueNode instanceof EnumValueNode) {
            $lookup = $this->getNameLookup();
            if (isset($lookup[$valueNode->value])) {
                $enumValue = $lookup[$valueNode->value];
                if ($enumValue !== null) {
                    return $enumValue->value;
                }
            }
        }

        // Intentionally without message, as all information already in wrapped Exception
        throw new Exception();
    }

    /**
     * @throws InvariantViolation
     */
    public function assertValid()
    {
        parent::assertValid();

        Utils::invariant(
            isset($this->config['values']),
            sprintf('%s values must be an array.', $this->name)
        );

        $values = $this->getValues();
        foreach ($values as $value) {
            Utils::invariant(
                ! isset($value->config['isDeprecated']),
                sprintf(
                    '%s.%s should provide "deprecationReason" instead of "isDeprecated".',
                    $this->name,
                    $value->name
                )
            );
        }
    }
}

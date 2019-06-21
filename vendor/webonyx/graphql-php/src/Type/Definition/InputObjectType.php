<?php

declare(strict_types=1);

namespace GraphQL\Type\Definition;

use Exception;
use GraphQL\Error\InvariantViolation;
use GraphQL\Language\AST\InputObjectTypeDefinitionNode;
use GraphQL\Language\AST\InputObjectTypeExtensionNode;
use GraphQL\Utils\Utils;
use function call_user_func;
use function is_array;
use function is_callable;
use function is_string;
use function sprintf;

class InputObjectType extends Type implements InputType, NullableType, NamedType
{
    /** @var InputObjectTypeDefinitionNode|null */
    public $astNode;

    /** @var InputObjectField[] */
    private $fields;

    /** @var InputObjectTypeExtensionNode[] */
    public $extensionASTNodes;

    /**
     * @param mixed[] $config
     */
    public function __construct(array $config)
    {
        if (! isset($config['name'])) {
            $config['name'] = $this->tryInferName();
        }

        Utils::invariant(is_string($config['name']), 'Must provide name.');

        $this->config            = $config;
        $this->name              = $config['name'];
        $this->astNode           = $config['astNode'] ?? null;
        $this->description       = $config['description'] ?? null;
        $this->extensionASTNodes = $config['extensionASTNodes'] ?? null;
    }

    /**
     * @param string $name
     *
     * @return InputObjectField
     *
     * @throws Exception
     */
    public function getField($name)
    {
        if ($this->fields === null) {
            $this->getFields();
        }
        Utils::invariant(isset($this->fields[$name]), "Field '%s' is not defined for type '%s'", $name, $this->name);

        return $this->fields[$name];
    }

    /**
     * @return InputObjectField[]
     */
    public function getFields()
    {
        if ($this->fields === null) {
            $this->fields = [];
            $fields       = $this->config['fields'] ?? [];
            $fields       = is_callable($fields) ? call_user_func($fields) : $fields;

            if (! is_array($fields)) {
                throw new InvariantViolation(
                    sprintf('%s fields must be an array or a callable which returns such an array.', $this->name)
                );
            }

            foreach ($fields as $name => $field) {
                if ($field instanceof Type) {
                    $field = ['type' => $field];
                }
                $field                      = new InputObjectField($field + ['name' => $name]);
                $this->fields[$field->name] = $field;
            }
        }

        return $this->fields;
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
            ! empty($this->getFields()),
            sprintf(
                '%s fields must be an associative array with field names as keys or a callable which returns such an array.',
                $this->name
            )
        );

        foreach ($this->getFields() as $field) {
            $field->assertValid($this);
        }
    }
}

<?php

declare(strict_types=1);

namespace GraphQL\Validator\Rules;

use GraphQL\Error\Error;
use GraphQL\Language\AST\NodeKind;
use GraphQL\Language\AST\ObjectFieldNode;
use GraphQL\Language\Visitor;
use GraphQL\Validator\ValidationContext;
use function array_pop;
use function sprintf;

class UniqueInputFieldNames extends ValidationRule
{
    /** @var string[] */
    public $knownNames;

    /** @var string[][] */
    public $knownNameStack;

    public function getVisitor(ValidationContext $context)
    {
        $this->knownNames     = [];
        $this->knownNameStack = [];

        return [
            NodeKind::OBJECT       => [
                'enter' => function () {
                    $this->knownNameStack[] = $this->knownNames;
                    $this->knownNames       = [];
                },
                'leave' => function () {
                    $this->knownNames = array_pop($this->knownNameStack);
                },
            ],
            NodeKind::OBJECT_FIELD => function (ObjectFieldNode $node) use ($context) {
                $fieldName = $node->name->value;

                if (! empty($this->knownNames[$fieldName])) {
                    $context->reportError(new Error(
                        self::duplicateInputFieldMessage($fieldName),
                        [$this->knownNames[$fieldName], $node->name]
                    ));
                } else {
                    $this->knownNames[$fieldName] = $node->name;
                }

                return Visitor::skipNode();
            },
        ];
    }

    public static function duplicateInputFieldMessage($fieldName)
    {
        return sprintf('There can be only one input field named "%s".', $fieldName);
    }
}

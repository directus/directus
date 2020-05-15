<?php

declare(strict_types=1);

namespace GraphQL\Validator\Rules;

use ArrayObject;
use GraphQL\Error\Error;
use GraphQL\Executor\Values;
use GraphQL\Language\AST\FieldNode;
use GraphQL\Language\AST\FragmentSpreadNode;
use GraphQL\Language\AST\InlineFragmentNode;
use GraphQL\Language\AST\Node;
use GraphQL\Language\AST\NodeKind;
use GraphQL\Language\AST\OperationDefinitionNode;
use GraphQL\Language\AST\SelectionSetNode;
use GraphQL\Language\Visitor;
use GraphQL\Type\Definition\Directive;
use GraphQL\Type\Definition\FieldDefinition;
use GraphQL\Validator\ValidationContext;
use function array_map;
use function call_user_func_array;
use function implode;
use function method_exists;
use function sprintf;

class QueryComplexity extends QuerySecurityRule
{
    /** @var int */
    private $maxQueryComplexity;

    /** @var mixed[]|null */
    private $rawVariableValues = [];

    /** @var ArrayObject */
    private $variableDefs;

    /** @var ArrayObject */
    private $fieldNodeAndDefs;

    /** @var ValidationContext */
    private $context;

    /** @var int */
    private $complexity;

    public function __construct($maxQueryComplexity)
    {
        $this->setMaxQueryComplexity($maxQueryComplexity);
    }

    public function getVisitor(ValidationContext $context)
    {
        $this->context = $context;

        $this->variableDefs     = new ArrayObject();
        $this->fieldNodeAndDefs = new ArrayObject();
        $this->complexity       = 0;

        return $this->invokeIfNeeded(
            $context,
            [
                NodeKind::SELECTION_SET        => function (SelectionSetNode $selectionSet) use ($context) {
                    $this->fieldNodeAndDefs = $this->collectFieldASTsAndDefs(
                        $context,
                        $context->getParentType(),
                        $selectionSet,
                        null,
                        $this->fieldNodeAndDefs
                    );
                },
                NodeKind::VARIABLE_DEFINITION  => function ($def) {
                    $this->variableDefs[] = $def;

                    return Visitor::skipNode();
                },
                NodeKind::OPERATION_DEFINITION => [
                    'leave' => function (OperationDefinitionNode $operationDefinition) use ($context, &$complexity) {
                        $errors = $context->getErrors();

                        if (! empty($errors)) {
                            return;
                        }

                        $this->complexity = $this->fieldComplexity($operationDefinition, $complexity);

                        if ($this->getQueryComplexity() <= $this->getMaxQueryComplexity()) {
                            return;
                        }

                        $context->reportError(
                            new Error(self::maxQueryComplexityErrorMessage(
                                $this->getMaxQueryComplexity(),
                                $this->getQueryComplexity()
                            ))
                        );
                    },
                ],
            ]
        );
    }

    private function fieldComplexity($node, $complexity = 0)
    {
        if (isset($node->selectionSet) && $node->selectionSet instanceof SelectionSetNode) {
            foreach ($node->selectionSet->selections as $childNode) {
                $complexity = $this->nodeComplexity($childNode, $complexity);
            }
        }

        return $complexity;
    }

    private function nodeComplexity(Node $node, $complexity = 0)
    {
        switch ($node->kind) {
            case NodeKind::FIELD:
                /** @var FieldNode $node */
                // default values
                $args         = [];
                $complexityFn = FieldDefinition::DEFAULT_COMPLEXITY_FN;

                // calculate children complexity if needed
                $childrenComplexity = 0;

                // node has children?
                if (isset($node->selectionSet)) {
                    $childrenComplexity = $this->fieldComplexity($node);
                }

                $astFieldInfo = $this->astFieldInfo($node);
                $fieldDef     = $astFieldInfo[1];

                if ($fieldDef instanceof FieldDefinition) {
                    if ($this->directiveExcludesField($node)) {
                        break;
                    }

                    $args = $this->buildFieldArguments($node);
                    //get complexity fn using fieldDef complexity
                    if (method_exists($fieldDef, 'getComplexityFn')) {
                        $complexityFn = $fieldDef->getComplexityFn();
                    }
                }

                $complexity += call_user_func_array($complexityFn, [$childrenComplexity, $args]);
                break;

            case NodeKind::INLINE_FRAGMENT:
                /** @var InlineFragmentNode $node */
                // node has children?
                if (isset($node->selectionSet)) {
                    $complexity = $this->fieldComplexity($node, $complexity);
                }
                break;

            case NodeKind::FRAGMENT_SPREAD:
                /** @var FragmentSpreadNode $node */
                $fragment = $this->getFragment($node);

                if ($fragment !== null) {
                    $complexity = $this->fieldComplexity($fragment, $complexity);
                }
                break;
        }

        return $complexity;
    }

    private function astFieldInfo(FieldNode $field)
    {
        $fieldName    = $this->getFieldName($field);
        $astFieldInfo = [null, null];
        if (isset($this->fieldNodeAndDefs[$fieldName])) {
            foreach ($this->fieldNodeAndDefs[$fieldName] as $astAndDef) {
                if ($astAndDef[0] === $field) {
                    $astFieldInfo = $astAndDef;
                    break;
                }
            }
        }

        return $astFieldInfo;
    }

    private function directiveExcludesField(FieldNode $node)
    {
        foreach ($node->directives as $directiveNode) {
            if ($directiveNode->name->value === 'deprecated') {
                return false;
            }
            [$errors, $variableValues] = Values::getVariableValues(
                $this->context->getSchema(),
                $this->variableDefs,
                $this->getRawVariableValues()
            );
            if (! empty($errors)) {
                throw new Error(implode(
                    "\n\n",
                    array_map(
                        static function ($error) {
                            return $error->getMessage();
                        },
                        $errors
                    )
                ));
            }
            if ($directiveNode->name->value === 'include') {
                $directive = Directive::includeDirective();
                /** @var bool $directiveArgsIf */
                $directiveArgsIf = Values::getArgumentValues($directive, $directiveNode, $variableValues)['if'];

                return ! $directiveArgsIf;
            }
            $directive       = Directive::skipDirective();
            $directiveArgsIf = Values::getArgumentValues($directive, $directiveNode, $variableValues);

            return $directiveArgsIf['if'];
        }
    }

    public function getRawVariableValues()
    {
        return $this->rawVariableValues;
    }

    /**
     * @param mixed[]|null $rawVariableValues
     */
    public function setRawVariableValues(?array $rawVariableValues = null)
    {
        $this->rawVariableValues = $rawVariableValues ?: [];
    }

    private function buildFieldArguments(FieldNode $node)
    {
        $rawVariableValues = $this->getRawVariableValues();
        $astFieldInfo      = $this->astFieldInfo($node);
        $fieldDef          = $astFieldInfo[1];

        $args = [];

        if ($fieldDef instanceof FieldDefinition) {
            [$errors, $variableValues] = Values::getVariableValues(
                $this->context->getSchema(),
                $this->variableDefs,
                $rawVariableValues
            );

            if (! empty($errors)) {
                throw new Error(implode(
                    "\n\n",
                    array_map(
                        static function ($error) {
                            return $error->getMessage();
                        },
                        $errors
                    )
                ));
            }

            $args = Values::getArgumentValues($fieldDef, $node, $variableValues);
        }

        return $args;
    }

    public function getQueryComplexity()
    {
        return $this->complexity;
    }

    public function getMaxQueryComplexity()
    {
        return $this->maxQueryComplexity;
    }

    /**
     * Set max query complexity. If equal to 0 no check is done. Must be greater or equal to 0.
     */
    public function setMaxQueryComplexity($maxQueryComplexity)
    {
        $this->checkIfGreaterOrEqualToZero('maxQueryComplexity', $maxQueryComplexity);

        $this->maxQueryComplexity = (int) $maxQueryComplexity;
    }

    public static function maxQueryComplexityErrorMessage($max, $count)
    {
        return sprintf('Max query complexity should be %d but got %d.', $max, $count);
    }

    protected function isEnabled()
    {
        return $this->getMaxQueryComplexity() !== self::DISABLED;
    }
}

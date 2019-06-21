<?php

declare(strict_types=1);

namespace GraphQL\Validator;

use GraphQL\Error\Error;
use GraphQL\Language\AST\DocumentNode;
use GraphQL\Language\AST\FragmentDefinitionNode;
use GraphQL\Language\AST\FragmentSpreadNode;
use GraphQL\Language\AST\HasSelectionSet;
use GraphQL\Language\AST\NodeKind;
use GraphQL\Language\AST\OperationDefinitionNode;
use GraphQL\Language\AST\SelectionSetNode;
use GraphQL\Language\AST\VariableNode;
use GraphQL\Language\Visitor;
use GraphQL\Type\Definition\FieldDefinition;
use GraphQL\Type\Definition\InputType;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Schema;
use GraphQL\Utils\TypeInfo;
use SplObjectStorage;
use function array_pop;
use function call_user_func_array;
use function count;

/**
 * An instance of this class is passed as the "this" context to all validators,
 * allowing access to commonly useful contextual information from within a
 * validation rule.
 */
class ValidationContext
{
    /** @var Schema */
    private $schema;

    /** @var DocumentNode */
    private $ast;

    /** @var TypeInfo */
    private $typeInfo;

    /** @var Error[] */
    private $errors;

    /** @var FragmentDefinitionNode[] */
    private $fragments;

    /** @var SplObjectStorage */
    private $fragmentSpreads;

    /** @var SplObjectStorage */
    private $recursivelyReferencedFragments;

    /** @var SplObjectStorage */
    private $variableUsages;

    /** @var SplObjectStorage */
    private $recursiveVariableUsages;

    public function __construct(Schema $schema, DocumentNode $ast, TypeInfo $typeInfo)
    {
        $this->schema                         = $schema;
        $this->ast                            = $ast;
        $this->typeInfo                       = $typeInfo;
        $this->errors                         = [];
        $this->fragmentSpreads                = new SplObjectStorage();
        $this->recursivelyReferencedFragments = new SplObjectStorage();
        $this->variableUsages                 = new SplObjectStorage();
        $this->recursiveVariableUsages        = new SplObjectStorage();
    }

    public function reportError(Error $error)
    {
        $this->errors[] = $error;
    }

    /**
     * @return Error[]
     */
    public function getErrors()
    {
        return $this->errors;
    }

    /**
     * @return Schema
     */
    public function getSchema()
    {
        return $this->schema;
    }

    /**
     * @return mixed[][] List of ['node' => VariableNode, 'type' => ?InputObjectType]
     */
    public function getRecursiveVariableUsages(OperationDefinitionNode $operation)
    {
        $usages = $this->recursiveVariableUsages[$operation] ?? null;

        if ($usages === null) {
            $usages    = $this->getVariableUsages($operation);
            $fragments = $this->getRecursivelyReferencedFragments($operation);

            $tmp = [$usages];
            foreach ($fragments as $i => $fragment) {
                $tmp[] = $this->getVariableUsages($fragments[$i]);
            }
            $usages                                    = call_user_func_array('array_merge', $tmp);
            $this->recursiveVariableUsages[$operation] = $usages;
        }

        return $usages;
    }

    /**
     * @return mixed[][] List of ['node' => VariableNode, 'type' => ?InputObjectType]
     */
    private function getVariableUsages(HasSelectionSet $node)
    {
        $usages = $this->variableUsages[$node] ?? null;

        if ($usages === null) {
            $newUsages = [];
            $typeInfo  = new TypeInfo($this->schema);
            Visitor::visit(
                $node,
                Visitor::visitWithTypeInfo(
                    $typeInfo,
                    [
                        NodeKind::VARIABLE_DEFINITION => static function () {
                            return false;
                        },
                        NodeKind::VARIABLE            => static function (VariableNode $variable) use (
                            &$newUsages,
                            $typeInfo
                        ) {
                            $newUsages[] = ['node' => $variable, 'type' => $typeInfo->getInputType()];
                        },
                    ]
                )
            );
            $usages                      = $newUsages;
            $this->variableUsages[$node] = $usages;
        }

        return $usages;
    }

    /**
     * @return FragmentDefinitionNode[]
     */
    public function getRecursivelyReferencedFragments(OperationDefinitionNode $operation)
    {
        $fragments = $this->recursivelyReferencedFragments[$operation] ?? null;

        if ($fragments === null) {
            $fragments      = [];
            $collectedNames = [];
            $nodesToVisit   = [$operation];
            while (! empty($nodesToVisit)) {
                $node    = array_pop($nodesToVisit);
                $spreads = $this->getFragmentSpreads($node);
                foreach ($spreads as $spread) {
                    $fragName = $spread->name->value;

                    if (! empty($collectedNames[$fragName])) {
                        continue;
                    }

                    $collectedNames[$fragName] = true;
                    $fragment                  = $this->getFragment($fragName);
                    if (! $fragment) {
                        continue;
                    }

                    $fragments[]    = $fragment;
                    $nodesToVisit[] = $fragment;
                }
            }
            $this->recursivelyReferencedFragments[$operation] = $fragments;
        }

        return $fragments;
    }

    /**
     * @return FragmentSpreadNode[]
     */
    public function getFragmentSpreads(HasSelectionSet $node)
    {
        $spreads = $this->fragmentSpreads[$node] ?? null;
        if ($spreads === null) {
            $spreads = [];
            /** @var SelectionSetNode[] $setsToVisit */
            $setsToVisit = [$node->selectionSet];
            while (! empty($setsToVisit)) {
                $set = array_pop($setsToVisit);

                for ($i = 0, $selectionCount = count($set->selections); $i < $selectionCount; $i++) {
                    $selection = $set->selections[$i];
                    if ($selection->kind === NodeKind::FRAGMENT_SPREAD) {
                        $spreads[] = $selection;
                    } elseif ($selection->selectionSet) {
                        $setsToVisit[] = $selection->selectionSet;
                    }
                }
            }
            $this->fragmentSpreads[$node] = $spreads;
        }

        return $spreads;
    }

    /**
     * @param string $name
     *
     * @return FragmentDefinitionNode|null
     */
    public function getFragment($name)
    {
        $fragments = $this->fragments;
        if (! $fragments) {
            $fragments = [];
            foreach ($this->getDocument()->definitions as $statement) {
                if ($statement->kind !== NodeKind::FRAGMENT_DEFINITION) {
                    continue;
                }

                $fragments[$statement->name->value] = $statement;
            }
            $this->fragments = $fragments;
        }

        return $fragments[$name] ?? null;
    }

    /**
     * @return DocumentNode
     */
    public function getDocument()
    {
        return $this->ast;
    }

    /**
     * Returns OutputType
     *
     * @return Type
     */
    public function getType()
    {
        return $this->typeInfo->getType();
    }

    /**
     * @return Type
     */
    public function getParentType()
    {
        return $this->typeInfo->getParentType();
    }

    /**
     * @return InputType
     */
    public function getInputType()
    {
        return $this->typeInfo->getInputType();
    }

    /**
     * @return InputType
     */
    public function getParentInputType()
    {
        return $this->typeInfo->getParentInputType();
    }

    /**
     * @return FieldDefinition
     */
    public function getFieldDef()
    {
        return $this->typeInfo->getFieldDef();
    }

    public function getDirective()
    {
        return $this->typeInfo->getDirective();
    }

    public function getArgument()
    {
        return $this->typeInfo->getArgument();
    }
}

<?php

declare(strict_types=1);

namespace GraphQL\Language;

use ArrayObject;
use Exception;
use GraphQL\Language\AST\Node;
use GraphQL\Language\AST\NodeKind;
use GraphQL\Language\AST\NodeList;
use GraphQL\Utils\TypeInfo;
use SplFixedArray;
use stdClass;
use function array_pop;
use function array_splice;
use function call_user_func;
use function call_user_func_array;
use function count;
use function func_get_args;
use function is_array;
use function is_callable;
use function json_encode;

/**
 * Utility for efficient AST traversal and modification.
 *
 * `visit()` will walk through an AST using a depth first traversal, calling
 * the visitor's enter function at each node in the traversal, and calling the
 * leave function after visiting that node and all of it's child nodes.
 *
 * By returning different values from the enter and leave functions, the
 * behavior of the visitor can be altered, including skipping over a sub-tree of
 * the AST (by returning false), editing the AST by returning a value or null
 * to remove the value, or to stop the whole traversal by returning BREAK.
 *
 * When using `visit()` to edit an AST, the original AST will not be modified, and
 * a new version of the AST with the changes applied will be returned from the
 * visit function.
 *
 *     $editedAST = Visitor::visit($ast, [
 *       'enter' => function ($node, $key, $parent, $path, $ancestors) {
 *         // return
 *         //   null: no action
 *         //   Visitor::skipNode(): skip visiting this node
 *         //   Visitor::stop(): stop visiting altogether
 *         //   Visitor::removeNode(): delete this node
 *         //   any value: replace this node with the returned value
 *       },
 *       'leave' => function ($node, $key, $parent, $path, $ancestors) {
 *         // return
 *         //   null: no action
 *         //   Visitor::stop(): stop visiting altogether
 *         //   Visitor::removeNode(): delete this node
 *         //   any value: replace this node with the returned value
 *       }
 *     ]);
 *
 * Alternatively to providing enter() and leave() functions, a visitor can
 * instead provide functions named the same as the [kinds of AST nodes](reference.md#graphqllanguageastnodekind),
 * or enter/leave visitors at a named key, leading to four permutations of
 * visitor API:
 *
 * 1) Named visitors triggered when entering a node a specific kind.
 *
 *     Visitor::visit($ast, [
 *       'Kind' => function ($node) {
 *         // enter the "Kind" node
 *       }
 *     ]);
 *
 * 2) Named visitors that trigger upon entering and leaving a node of
 *    a specific kind.
 *
 *     Visitor::visit($ast, [
 *       'Kind' => [
 *         'enter' => function ($node) {
 *           // enter the "Kind" node
 *         }
 *         'leave' => function ($node) {
 *           // leave the "Kind" node
 *         }
 *       ]
 *     ]);
 *
 * 3) Generic visitors that trigger upon entering and leaving any node.
 *
 *     Visitor::visit($ast, [
 *       'enter' => function ($node) {
 *         // enter any node
 *       },
 *       'leave' => function ($node) {
 *         // leave any node
 *       }
 *     ]);
 *
 * 4) Parallel visitors for entering and leaving nodes of a specific kind.
 *
 *     Visitor::visit($ast, [
 *       'enter' => [
 *         'Kind' => function($node) {
 *           // enter the "Kind" node
 *         }
 *       },
 *       'leave' => [
 *         'Kind' => function ($node) {
 *           // leave the "Kind" node
 *         }
 *       ]
 *     ]);
 */
class Visitor
{
    /** @var string[][] */
    public static $visitorKeys = [
        NodeKind::NAME                 => [],
        NodeKind::DOCUMENT             => ['definitions'],
        NodeKind::OPERATION_DEFINITION => ['name', 'variableDefinitions', 'directives', 'selectionSet'],
        NodeKind::VARIABLE_DEFINITION  => ['variable', 'type', 'defaultValue'],
        NodeKind::VARIABLE             => ['name'],
        NodeKind::SELECTION_SET        => ['selections'],
        NodeKind::FIELD                => ['alias', 'name', 'arguments', 'directives', 'selectionSet'],
        NodeKind::ARGUMENT             => ['name', 'value'],
        NodeKind::FRAGMENT_SPREAD      => ['name', 'directives'],
        NodeKind::INLINE_FRAGMENT      => ['typeCondition', 'directives', 'selectionSet'],
        NodeKind::FRAGMENT_DEFINITION  => [
            'name',
            // Note: fragment variable definitions are experimental and may be changed
            // or removed in the future.
            'variableDefinitions',
            'typeCondition',
            'directives',
            'selectionSet',
        ],

        NodeKind::INT           => [],
        NodeKind::FLOAT         => [],
        NodeKind::STRING        => [],
        NodeKind::BOOLEAN       => [],
        NodeKind::NULL          => [],
        NodeKind::ENUM          => [],
        NodeKind::LST           => ['values'],
        NodeKind::OBJECT        => ['fields'],
        NodeKind::OBJECT_FIELD  => ['name', 'value'],
        NodeKind::DIRECTIVE     => ['name', 'arguments'],
        NodeKind::NAMED_TYPE    => ['name'],
        NodeKind::LIST_TYPE     => ['type'],
        NodeKind::NON_NULL_TYPE => ['type'],

        NodeKind::SCHEMA_DEFINITION            => ['directives', 'operationTypes'],
        NodeKind::OPERATION_TYPE_DEFINITION    => ['type'],
        NodeKind::SCALAR_TYPE_DEFINITION       => ['description', 'name', 'directives'],
        NodeKind::OBJECT_TYPE_DEFINITION       => ['description', 'name', 'interfaces', 'directives', 'fields'],
        NodeKind::FIELD_DEFINITION             => ['description', 'name', 'arguments', 'type', 'directives'],
        NodeKind::INPUT_VALUE_DEFINITION       => ['description', 'name', 'type', 'defaultValue', 'directives'],
        NodeKind::INTERFACE_TYPE_DEFINITION    => ['description', 'name', 'directives', 'fields'],
        NodeKind::UNION_TYPE_DEFINITION        => ['description', 'name', 'directives', 'types'],
        NodeKind::ENUM_TYPE_DEFINITION         => ['description', 'name', 'directives', 'values'],
        NodeKind::ENUM_VALUE_DEFINITION        => ['description', 'name', 'directives'],
        NodeKind::INPUT_OBJECT_TYPE_DEFINITION => ['description', 'name', 'directives', 'fields'],

        NodeKind::SCALAR_TYPE_EXTENSION       => ['name', 'directives'],
        NodeKind::OBJECT_TYPE_EXTENSION       => ['name', 'interfaces', 'directives', 'fields'],
        NodeKind::INTERFACE_TYPE_EXTENSION    => ['name', 'directives', 'fields'],
        NodeKind::UNION_TYPE_EXTENSION        => ['name', 'directives', 'types'],
        NodeKind::ENUM_TYPE_EXTENSION         => ['name', 'directives', 'values'],
        NodeKind::INPUT_OBJECT_TYPE_EXTENSION => ['name', 'directives', 'fields'],

        NodeKind::DIRECTIVE_DEFINITION => ['description', 'name', 'arguments', 'locations'],

        NodeKind::SCHEMA_EXTENSION => ['directives', 'operationTypes'],
    ];

    /**
     * Visit the AST (see class description for details)
     *
     * @param Node|ArrayObject|stdClass $root
     * @param callable[]                $visitor
     * @param mixed[]|null              $keyMap
     *
     * @return Node|mixed
     *
     * @throws Exception
     *
     * @api
     */
    public static function visit($root, $visitor, $keyMap = null)
    {
        $visitorKeys = $keyMap ?: self::$visitorKeys;

        $stack     = null;
        $inArray   = $root instanceof NodeList || is_array($root);
        $keys      = [$root];
        $index     = -1;
        $edits     = [];
        $parent    = null;
        $path      = [];
        $ancestors = [];
        $newRoot   = $root;

        $UNDEFINED = null;

        do {
            $index++;
            $isLeaving = $index === count($keys);
            $key       = null;
            $node      = null;
            $isEdited  = $isLeaving && count($edits) !== 0;

            if ($isLeaving) {
                $key    = ! $ancestors ? $UNDEFINED : $path[count($path) - 1];
                $node   = $parent;
                $parent = array_pop($ancestors);

                if ($isEdited) {
                    if ($inArray) {
                        // $node = $node; // arrays are value types in PHP
                        if ($node instanceof NodeList) {
                            $node = clone $node;
                        }
                    } else {
                        $node = clone $node;
                    }
                    $editOffset = 0;
                    for ($ii = 0; $ii < count($edits); $ii++) {
                        $editKey   = $edits[$ii][0];
                        $editValue = $edits[$ii][1];

                        if ($inArray) {
                            $editKey -= $editOffset;
                        }
                        if ($inArray && $editValue === null) {
                            if ($node instanceof NodeList) {
                                $node->splice($editKey, 1);
                            } else {
                                array_splice($node, $editKey, 1);
                            }
                            $editOffset++;
                        } else {
                            if ($node instanceof NodeList || is_array($node)) {
                                $node[$editKey] = $editValue;
                            } else {
                                $node->{$editKey} = $editValue;
                            }
                        }
                    }
                }
                $index   = $stack['index'];
                $keys    = $stack['keys'];
                $edits   = $stack['edits'];
                $inArray = $stack['inArray'];
                $stack   = $stack['prev'];
            } else {
                $key  = $parent !== null ? ($inArray ? $index : $keys[$index]) : $UNDEFINED;
                $node = $parent !== null ? ($parent instanceof NodeList || is_array($parent) ? $parent[$key] : $parent->{$key}) : $newRoot;
                if ($node === null || $node === $UNDEFINED) {
                    continue;
                }
                if ($parent !== null) {
                    $path[] = $key;
                }
            }

            $result = null;
            if (! $node instanceof NodeList && ! is_array($node)) {
                if (! ($node instanceof Node)) {
                    throw new Exception('Invalid AST Node: ' . json_encode($node));
                }

                $visitFn = self::getVisitFn($visitor, $node->kind, $isLeaving);

                if ($visitFn) {
                    $result    = call_user_func($visitFn, $node, $key, $parent, $path, $ancestors);
                    $editValue = null;

                    if ($result !== null) {
                        if ($result instanceof VisitorOperation) {
                            if ($result->doBreak) {
                                break;
                            }
                            if (! $isLeaving && $result->doContinue) {
                                array_pop($path);
                                continue;
                            }
                            if ($result->removeNode) {
                                $editValue = null;
                            }
                        } else {
                            $editValue = $result;
                        }

                        $edits[] = [$key, $editValue];
                        if (! $isLeaving) {
                            if (! ($editValue instanceof Node)) {
                                array_pop($path);
                                continue;
                            }

                            $node = $editValue;
                        }
                    }
                }
            }

            if ($result === null && $isEdited) {
                $edits[] = [$key, $node];
            }

            if ($isLeaving) {
                array_pop($path);
            } else {
                $stack   = [
                    'inArray' => $inArray,
                    'index'   => $index,
                    'keys'    => $keys,
                    'edits'   => $edits,
                    'prev'    => $stack,
                ];
                $inArray = $node instanceof NodeList || is_array($node);

                $keys  = ($inArray ? $node : $visitorKeys[$node->kind]) ?: [];
                $index = -1;
                $edits = [];
                if ($parent !== null) {
                    $ancestors[] = $parent;
                }
                $parent = $node;
            }
        } while ($stack);

        if (count($edits) !== 0) {
            $newRoot = $edits[0][1];
        }

        return $newRoot;
    }

    /**
     * Returns marker for visitor break
     *
     * @return VisitorOperation
     *
     * @api
     */
    public static function stop()
    {
        $r          = new VisitorOperation();
        $r->doBreak = true;

        return $r;
    }

    /**
     * Returns marker for skipping current node
     *
     * @return VisitorOperation
     *
     * @api
     */
    public static function skipNode()
    {
        $r             = new VisitorOperation();
        $r->doContinue = true;

        return $r;
    }

    /**
     * Returns marker for removing a node
     *
     * @return VisitorOperation
     *
     * @api
     */
    public static function removeNode()
    {
        $r             = new VisitorOperation();
        $r->removeNode = true;

        return $r;
    }

    /**
     * @param callable[][] $visitors
     *
     * @return callable[][]
     */
    public static function visitInParallel($visitors)
    {
        $visitorsCount = count($visitors);
        $skipping      = new SplFixedArray($visitorsCount);

        return [
            'enter' => static function (Node $node) use ($visitors, $skipping, $visitorsCount) {
                for ($i = 0; $i < $visitorsCount; $i++) {
                    if (! empty($skipping[$i])) {
                        continue;
                    }

                    $fn = self::getVisitFn(
                        $visitors[$i],
                        $node->kind, /* isLeaving */
                        false
                    );

                    if (! $fn) {
                        continue;
                    }

                    $result = call_user_func_array($fn, func_get_args());

                    if ($result instanceof VisitorOperation) {
                        if ($result->doContinue) {
                            $skipping[$i] = $node;
                        } elseif ($result->doBreak) {
                            $skipping[$i] = $result;
                        } elseif ($result->removeNode) {
                            return $result;
                        }
                    } elseif ($result !== null) {
                        return $result;
                    }
                }
            },
            'leave' => static function (Node $node) use ($visitors, $skipping, $visitorsCount) {
                for ($i = 0; $i < $visitorsCount; $i++) {
                    if (empty($skipping[$i])) {
                        $fn = self::getVisitFn(
                            $visitors[$i],
                            $node->kind, /* isLeaving */
                            true
                        );

                        if ($fn) {
                            $result = call_user_func_array($fn, func_get_args());
                            if ($result instanceof VisitorOperation) {
                                if ($result->doBreak) {
                                    $skipping[$i] = $result;
                                } elseif ($result->removeNode) {
                                    return $result;
                                }
                            } elseif ($result !== null) {
                                return $result;
                            }
                        }
                    } elseif ($skipping[$i] === $node) {
                        $skipping[$i] = null;
                    }
                }
            },
        ];
    }

    /**
     * Creates a new visitor instance which maintains a provided TypeInfo instance
     * along with visiting visitor.
     */
    public static function visitWithTypeInfo(TypeInfo $typeInfo, $visitor)
    {
        return [
            'enter' => static function (Node $node) use ($typeInfo, $visitor) {
                $typeInfo->enter($node);
                $fn = self::getVisitFn($visitor, $node->kind, false);

                if ($fn) {
                    $result = call_user_func_array($fn, func_get_args());
                    if ($result !== null) {
                        $typeInfo->leave($node);
                        if ($result instanceof Node) {
                            $typeInfo->enter($result);
                        }
                    }

                    return $result;
                }

                return null;
            },
            'leave' => static function (Node $node) use ($typeInfo, $visitor) {
                $fn     = self::getVisitFn($visitor, $node->kind, true);
                $result = $fn ? call_user_func_array($fn, func_get_args()) : null;
                $typeInfo->leave($node);

                return $result;
            },
        ];
    }

    /**
     * @param callable[]|null $visitor
     * @param string          $kind
     * @param bool            $isLeaving
     *
     * @return callable|null
     */
    public static function getVisitFn($visitor, $kind, $isLeaving)
    {
        if ($visitor === null) {
            return null;
        }

        $kindVisitor = $visitor[$kind] ?? null;

        if (! $isLeaving && is_callable($kindVisitor)) {
            // { Kind() {} }
            return $kindVisitor;
        }

        if (is_array($kindVisitor)) {
            if ($isLeaving) {
                $kindSpecificVisitor = $kindVisitor['leave'] ?? null;
            } else {
                $kindSpecificVisitor = $kindVisitor['enter'] ?? null;
            }

            if ($kindSpecificVisitor && is_callable($kindSpecificVisitor)) {
                // { Kind: { enter() {}, leave() {} } }
                return $kindSpecificVisitor;
            }

            return null;
        }

        $visitor += ['leave' => null, 'enter' => null];

        $specificVisitor = $isLeaving ? $visitor['leave'] : $visitor['enter'];

        if ($specificVisitor) {
            if (is_callable($specificVisitor)) {
                // { enter() {}, leave() {} }
                return $specificVisitor;
            }
            $specificKindVisitor = $specificVisitor[$kind] ?? null;

            if (is_callable($specificKindVisitor)) {
                // { enter: { Kind() {} }, leave: { Kind() {} } }
                return $specificKindVisitor;
            }
        }

        return null;
    }
}

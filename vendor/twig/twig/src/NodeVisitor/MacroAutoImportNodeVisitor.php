<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig\NodeVisitor;

use Twig\Environment;
use Twig\Node\Expression\AssignNameExpression;
use Twig\Node\Expression\ConstantExpression;
use Twig\Node\Expression\GetAttrExpression;
use Twig\Node\Expression\MethodCallExpression;
use Twig\Node\Expression\NameExpression;
use Twig\Node\ImportNode;
use Twig\Node\ModuleNode;
use Twig\Node\Node;

/**
 * @author Fabien Potencier <fabien@symfony.com>
 */
final class MacroAutoImportNodeVisitor implements NodeVisitorInterface
{
    private $inAModule = false;
    private $hasMacroCalls = false;

    public function enterNode(Node $node, Environment $env): Node
    {
        if ($node instanceof ModuleNode) {
            $this->inAModule = true;
            $this->hasMacroCalls = false;
        }

        return $node;
    }

    public function leaveNode(Node $node, Environment $env): Node
    {
        if ($node instanceof ModuleNode) {
            $this->inAModule = false;
            if ($this->hasMacroCalls) {
                $node->getNode('constructor_end')->setNode('_auto_macro_import', new ImportNode(new NameExpression('_self', 0), new AssignNameExpression('_self', 0), 0, 'import', true));
            }
        } elseif ($this->inAModule) {
            if (
                $node instanceof GetAttrExpression &&
                $node->getNode('node') instanceof NameExpression &&
                '_self' === $node->getNode('node')->getAttribute('name') &&
                $node->getNode('attribute') instanceof ConstantExpression
            ) {
                $this->hasMacroCalls = true;

                $name = $node->getNode('attribute')->getAttribute('value');
                $node = new MethodCallExpression($node->getNode('node'), 'macro_'.$name, $node->getNode('arguments'), $node->getTemplateLine());
                $node->setAttribute('safe', true);
            }
        }

        return $node;
    }

    public function getPriority(): int
    {
        // we must be ran before auto-escaping
        return -10;
    }
}

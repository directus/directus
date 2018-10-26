<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 * (c) Armin Ronacher
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Abstract class for all nodes that represents an expression.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
abstract class Twig_Node_Expression extends Twig_Node
{
}

class_alias('Twig_Node_Expression', 'Twig\Node\Expression\AbstractExpression', false);

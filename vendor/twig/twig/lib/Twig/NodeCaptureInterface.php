<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Represents a node that captures any nested displayable nodes.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
interface Twig_NodeCaptureInterface
{
}

class_alias('Twig_NodeCaptureInterface', 'Twig\Node\NodeCaptureInterface', false);

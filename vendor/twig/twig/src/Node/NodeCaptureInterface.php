<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig\Node;

/**
 * Represents a node that captures any nested displayable nodes.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
interface NodeCaptureInterface
{
}

class_alias('Twig\Node\NodeCaptureInterface', 'Twig_NodeCaptureInterface');

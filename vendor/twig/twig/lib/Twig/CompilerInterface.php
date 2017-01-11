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
 * Interface implemented by compiler classes.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 *
 * @deprecated since 1.12 (to be removed in 3.0)
 */
interface Twig_CompilerInterface
{
    /**
     * Compiles a node.
     *
     * @return $this
     */
    public function compile(Twig_NodeInterface $node);

    /**
     * Gets the current PHP code after compilation.
     *
     * @return string The PHP code
     */
    public function getSource();
}

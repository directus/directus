<?php

/*
 * This file is part of Twig.
 *
 * (c) 2009 Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Interface implemented by parser classes.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 *
 * @deprecated since 1.12 (to be removed in 3.0)
 */
interface Twig_ParserInterface
{
    /**
     * Converts a token stream to a node tree.
     *
     * @param Twig_TokenStream $stream A token stream instance
     *
     * @return Twig_Node_Module A node tree
     *
     * @throws Twig_Error_Syntax When the token stream is syntactically or semantically wrong
     */
    public function parse(Twig_TokenStream $stream);
}

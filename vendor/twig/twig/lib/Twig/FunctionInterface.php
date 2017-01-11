<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 * (c) Arnaud Le Blanc
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Represents a template function.
 *
 * Use Twig_SimpleFunction instead.
 *
 * @author Arnaud Le Blanc <arnaud.lb@gmail.com>
 *
 * @deprecated since 1.12 (to be removed in 2.0)
 */
interface Twig_FunctionInterface
{
    /**
     * Compiles a function.
     *
     * @return string The PHP code for the function
     */
    public function compile();

    public function needsEnvironment();

    public function needsContext();

    public function getSafe(Twig_Node $filterArgs);

    public function setArguments($arguments);

    public function getArguments();
}

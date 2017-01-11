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
 * @final
 */
class Twig_Extension_Optimizer extends Twig_Extension
{
    protected $optimizers;

    public function __construct($optimizers = -1)
    {
        $this->optimizers = $optimizers;
    }

    public function getNodeVisitors()
    {
        return array(new Twig_NodeVisitor_Optimizer($this->optimizers));
    }

    public function getName()
    {
        return 'optimizer';
    }
}

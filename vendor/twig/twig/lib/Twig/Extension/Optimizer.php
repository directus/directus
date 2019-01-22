<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

final class Twig_Extension_Optimizer extends Twig_Extension
{
    private $optimizers;

    public function __construct($optimizers = -1)
    {
        $this->optimizers = $optimizers;
    }

    public function getNodeVisitors()
    {
        return [new Twig_NodeVisitor_Optimizer($this->optimizers)];
    }
}

class_alias('Twig_Extension_Optimizer', 'Twig\Extension\OptimizerExtension', false);

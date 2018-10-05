<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

abstract class Twig_Extension implements Twig_ExtensionInterface
{
    public function getTokenParsers()
    {
        return array();
    }

    public function getNodeVisitors()
    {
        return array();
    }

    public function getFilters()
    {
        return array();
    }

    public function getTests()
    {
        return array();
    }

    public function getFunctions()
    {
        return array();
    }

    public function getOperators()
    {
        return array();
    }
}

class_alias('Twig_Extension', 'Twig\Extension\AbstractExtension', false);
class_exists('Twig_Environment');

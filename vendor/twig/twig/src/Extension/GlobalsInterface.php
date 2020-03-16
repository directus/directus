<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig\Extension;

/**
 * Enables usage of the deprecated Twig\Extension\AbstractExtension::getGlobals() method.
 *
 * Explicitly implement this interface if you really need to implement the
 * deprecated getGlobals() method in your extensions.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
interface GlobalsInterface
{
    /**
     * Returns a list of global variables to add to the existing list.
     *
     * @return array An array of global variables
     */
    public function getGlobals();
}

class_alias('Twig\Extension\GlobalsInterface', 'Twig_Extension_GlobalsInterface');

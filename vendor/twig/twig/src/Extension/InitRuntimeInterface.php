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

use Twig\Environment;

/**
 * Enables usage of the deprecated Twig\Extension\AbstractExtension::initRuntime() method.
 *
 * Explicitly implement this interface if you really need to implement the
 * deprecated initRuntime() method in your extensions.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 *
 * @deprecated since Twig 2.7, to be removed in 3.0
 */
interface InitRuntimeInterface
{
    /**
     * Initializes the runtime environment.
     *
     * This is where you can load some file that contains filter functions for instance.
     */
    public function initRuntime(Environment $environment);
}

class_alias('Twig\Extension\InitRuntimeInterface', 'Twig_Extension_InitRuntimeInterface');

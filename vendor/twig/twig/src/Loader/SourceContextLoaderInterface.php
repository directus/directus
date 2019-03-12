<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig\Loader;

/**
 * Empty interface for Twig 1.x compatibility.
 */
interface SourceContextLoaderInterface extends LoaderInterface
{
}

class_alias('Twig\Loader\SourceContextLoaderInterface', 'Twig_SourceContextLoaderInterface');

<?php

/**
 * This file is part of cocur/slugify.
 *
 * (c) Florian Eckerstorfer <florian@eckerstorfer.co>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Cocur\Slugify;

/**
 * SlugifyInterface
 *
 * @package   org.cocur.slugify
 * @author    Florian Eckerstorfer <florian@eckerstorfer.co>
 * @author    Marchenko Alexandr
 * @copyright 2012-2014 Florian Eckerstorfer
 * @license   http://www.opensource.org/licenses/MIT The MIT License
 */
interface SlugifyInterface
{
    /**
     * Return a URL safe version of a string.
     *
     * @param string            $string
     * @param string|array|null $options
     *
     * @return string
     *
     * @api
     */
    public function slugify($string, $options = null);
}

<?php

/**
 * This file is part of cocur/slugify.
 *
 * (c) Florian Eckerstorfer <florian@eckerstorfer.co>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Cocur\Slugify\Bridge\Silex2;

use Cocur\Slugify\Bridge\Twig\SlugifyExtension;
use Cocur\Slugify\Slugify;
use Pimple\Container;
use Pimple\ServiceProviderInterface;

/**
 * SlugifyServiceProvider
 *
 * @package    cocur/slugify
 * @subpackage bridge
 * @license    http://www.opensource.org/licenses/MIT The MIT License
 */
class SlugifyServiceProvider implements ServiceProviderInterface
{
    /**
     * {@inheritDoc}
     */
    public function register(Container $container)
    {
        $container['slugify.options']  = [];
        $container['slugify.provider'] = null;

        $container['slugify'] = function ($container) {
            return new Slugify($container['slugify.options'], $container['slugify.provider']);
        };

        if (isset($container['twig'])) {
            $container->extend('twig', function (\Twig_Environment $twig, $container) {
                $twig->addExtension(new SlugifyExtension($container['slugify']));

                return $twig;
            });
        }
    }
}

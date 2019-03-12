<?php

/**
 * This file is part of cocur/slugify.
 *
 * (c) Florian Eckerstorfer <florian@eckerstorfer.co>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Cocur\Slugify\Bridge\Silex;

use Cocur\Slugify\Bridge\Twig\SlugifyExtension;
use Cocur\Slugify\Slugify;
use Silex\Application;
use Silex\ServiceProviderInterface;

/**
 * SlugifyServiceProvider
 *
 * @package    cocur/slugify
 * @subpackage bridge
 * @author     Florian Eckerstorfer <florian@eckerstorfer.co>
 * @copyright  2012-2014 Florian Eckerstorfer
 * @license    http://www.opensource.org/licenses/MIT The MIT License
 */
class SlugifyServiceProvider implements ServiceProviderInterface
{
    /**
     * {@inheritDoc}
     */
    public function register(Application $app)
    {
        $app['slugify.options']  = [];
        $app['slugify.provider'] = null;

        $app['slugify'] = $app->share(function ($app) {
            return new Slugify($app['slugify.options'], $app['slugify.provider']);
        });

        if (isset($app['twig'])) {
            $app['twig'] = $app->share($app->extend('twig', function (\Twig_Environment $twig, $app) {
                $twig->addExtension(new SlugifyExtension($app['slugify']));

                return $twig;
            }));
        }
    }

    /**
     * {@inheritDoc}
     */
    public function boot(Application $app)
    {
    }
}

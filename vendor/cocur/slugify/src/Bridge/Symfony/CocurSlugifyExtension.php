<?php

/**
 * This file is part of cocur/slugify.
 *
 * (c) Florian Eckerstorfer <florian@eckerstorfer.co>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Cocur\Slugify\Bridge\Symfony;

use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Definition;
use Symfony\Component\DependencyInjection\Reference;
use Symfony\Component\HttpKernel\DependencyInjection\Extension;
use Symfony\Component\HttpKernel\Kernel;

/**
 * CocurSlugifyExtension
 *
 * @package    cocur/slugify
 * @subpackage bridge
 * @author     Florian Eckerstorfer <florian@eckerstorfer.co>
 * @copyright  2012-2014 Florian Eckerstorfer
 * @license    http://www.opensource.org/licenses/MIT The MIT License
 */
class CocurSlugifyExtension extends Extension
{
    /**
     * {@inheritDoc}
     *
     * @param mixed[]          $configs
     * @param ContainerBuilder $container
     */
    public function load(array $configs, ContainerBuilder $container)
    {
        $configuration = new Configuration();
        $config = $this->processConfiguration($configuration, $configs);

        if (empty($config['rulesets'])) {
            unset($config['rulesets']);
        }

        // Extract slugify arguments from config
        $slugifyArguments = array_intersect_key($config, array_flip(['lowercase', 'trim', 'strip_tags', 'separator', 'regexp', 'rulesets']));

        $container->setDefinition('cocur_slugify', new Definition('Cocur\Slugify\Slugify', [$slugifyArguments]));
        $container
            ->setDefinition(
                'cocur_slugify.twig.slugify',
                new Definition(
                    'Cocur\Slugify\Bridge\Twig\SlugifyExtension',
                    [new Reference('cocur_slugify')]
                )
            )
            ->addTag('twig.extension')
            ->setPublic(false);
        $container->setAlias('slugify', 'cocur_slugify');

        // for symfony versions >= 3.3
        if (Kernel::VERSION_ID >= 30300) {
            $container->setAlias('Cocur\Slugify\SlugifyInterface', 'cocur_slugify');
        }
    }
}

<?php

namespace Cocur\Slugify\Bridge\League;

use Cocur\Slugify\RuleProvider\DefaultRuleProvider;
use Cocur\Slugify\RuleProvider\RuleProviderInterface;
use Cocur\Slugify\Slugify;
use Cocur\Slugify\SlugifyInterface;
use League\Container\ServiceProvider\AbstractServiceProvider;

class SlugifyServiceProvider extends AbstractServiceProvider
{
    protected $provides = [
        SlugifyInterface::class,
    ];

    public function register()
    {
        $this->container->share(SlugifyInterface::class, function () {
            $options = [];
            if ($this->container->has('config.slugify.options')) {
                $options = $this->container->get('config.slugify.options');
            }

            $provider = null;
            if ($this->container->has(RuleProviderInterface::class)) {
                /* @var RuleProviderInterface $provider */
                $provider = $this->container->get(RuleProviderInterface::class);
            }

            return new Slugify(
                $options,
                $provider
            );
        });
    }
}

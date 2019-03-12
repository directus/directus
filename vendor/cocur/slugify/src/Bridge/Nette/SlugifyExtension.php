<?php

namespace Cocur\Slugify\Bridge\Nette;

use Nette\DI\CompilerExtension;
use Nette\DI\ServiceDefinition;

/**
 * SlugifyExtension
 *
 * @package    cocur/slugify
 * @subpackage bridge
 * @author     Lukáš Unger <looky.msc@gmail.com>
 * @license    http://www.opensource.org/licenses/MIT The MIT License
 */
class SlugifyExtension extends CompilerExtension
{
    public function loadConfiguration()
    {
        $builder = $this->getContainerBuilder();

        $builder->addDefinition($this->prefix('slugify'))
            ->setClass('Cocur\Slugify\SlugifyInterface')
            ->setFactory('Cocur\Slugify\Slugify');

        $builder->addDefinition($this->prefix('helper'))
            ->setClass('Cocur\Slugify\Bridge\Latte\SlugifyHelper')
            ->setAutowired(false);
    }

    public function beforeCompile()
    {
        $builder = $this->getContainerBuilder();

        $self = $this;
        $registerToLatte = function(ServiceDefinition $def) use ($self) {
            $def->addSetup('addFilter', ['slugify', [$self->prefix('@helper'), 'slugify']]);
        };

        $latteFactory = $builder->getByType('Nette\Bridges\ApplicationLatte\ILatteFactory') ?: 'nette.latteFactory';
        if ($builder->hasDefinition($latteFactory)) {
            $registerToLatte($builder->getDefinition($latteFactory));
        }

        if ($builder->hasDefinition('nette.latte')) {
            $registerToLatte($builder->getDefinition('nette.latte'));
        }
    }
}

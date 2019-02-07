<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Tests\DependencyInjection;

use PHPUnit\Framework\TestCase;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Reference;
use Symfony\Component\Validator\DependencyInjection\AddValidatorInitializersPass;

class AddValidatorInitializersPassTest extends TestCase
{
    public function testProcess()
    {
        $container = new ContainerBuilder();
        $container
            ->register('initializer1')
            ->addTag('validator.initializer')
        ;
        $container
            ->register('initializer2')
            ->addTag('validator.initializer')
        ;
        $container
            ->register('validator.builder')
            ->addArgument([])
        ;

        (new AddValidatorInitializersPass())->process($container);

        $this->assertEquals(
            [['addObjectInitializers', [[new Reference('initializer1'), new Reference('initializer2')]]]],
            $container->getDefinition('validator.builder')->getMethodCalls()
        );
    }
}

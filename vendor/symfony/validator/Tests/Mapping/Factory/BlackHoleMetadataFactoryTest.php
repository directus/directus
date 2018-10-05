<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Tests\Mapping\Factory;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Mapping\Factory\BlackHoleMetadataFactory;

class BlackHoleMetadataFactoryTest extends TestCase
{
    /**
     * @expectedException \LogicException
     */
    public function testGetMetadataForThrowsALogicException()
    {
        $metadataFactory = new BlackHoleMetadataFactory();
        $metadataFactory->getMetadataFor('foo');
    }

    public function testHasMetadataForReturnsFalse()
    {
        $metadataFactory = new BlackHoleMetadataFactory();

        $this->assertFalse($metadataFactory->hasMetadataFor('foo'));
    }
}

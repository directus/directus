<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Config\Tests\Definition\Builder;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Config\Definition\Builder\ArrayNodeDefinition;
use Symfony\Component\Config\Definition\Builder\NodeDefinition;

class NodeDefinitionTest extends TestCase
{
    public function testSetPathSeparatorChangesChildren()
    {
        $parentNode = new ArrayNodeDefinition('name');
        $childNode = $this->createMock(NodeDefinition::class);

        $childNode
            ->expects($this->once())
            ->method('setPathSeparator')
            ->with('/');
        $childNode
            ->expects($this->once())
            ->method('setParent')
            ->with($parentNode)
            ->willReturn($childNode);
        $parentNode->append($childNode);

        $parentNode->setPathSeparator('/');
    }
}

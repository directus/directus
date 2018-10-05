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
use Symfony\Component\Config\Definition\Builder\ScalarNodeDefinition;

class NodeDefinitionTest extends TestCase
{
    public function testDefaultPathSeparatorIsDot()
    {
        $node = $this->getMockForAbstractClass(NodeDefinition::class, array('foo'));

        $this->assertAttributeSame('.', 'pathSeparator', $node);
    }

    public function testSetPathSeparatorChangesChildren()
    {
        $node = new ArrayNodeDefinition('foo');
        $scalar = new ScalarNodeDefinition('bar');
        $node->append($scalar);

        $node->setPathSeparator('/');

        $this->assertAttributeSame('/', 'pathSeparator', $node);
        $this->assertAttributeSame('/', 'pathSeparator', $scalar);
    }
}

<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Config\Tests\Definition;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Config\Definition\BaseNode;
use Symfony\Component\Config\Definition\NodeInterface;

class BaseNodeTest extends TestCase
{
    /**
     * @dataProvider providePath
     */
    public function testGetPathForChildNode($expected, array $params)
    {
        $constructorArgs = [];
        $constructorArgs[] = $params[0];

        if (isset($params[1])) {
            // Handle old PHPUnit version for PHP 5.5
            $parent = method_exists($this, 'createMock')
                    ? $this->createMock(NodeInterface::class)
                    : $this->getMock(NodeInterface::class);
            $parent->method('getPath')->willReturn($params[1]);

            $constructorArgs[] = $parent;

            if (isset($params[2])) {
                $constructorArgs[] = $params[2];
            }
        }

        $node = $this->getMockForAbstractClass(BaseNode::class, $constructorArgs);

        $this->assertSame($expected, $node->getPath());
    }

    public function providePath()
    {
        return [
            'name only' => ['root', ['root']],
            'name and parent' => ['foo.bar.baz.bim', ['bim', 'foo.bar.baz']],
            'name and separator' => ['foo', ['foo', null, '/']],
            'name, parent and separator' => ['foo.bar/baz/bim', ['bim', 'foo.bar/baz', '/']],
        ];
    }
}

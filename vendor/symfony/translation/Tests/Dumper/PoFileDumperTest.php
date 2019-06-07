<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Translation\Tests\Dumper;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Translation\Dumper\PoFileDumper;
use Symfony\Component\Translation\MessageCatalogue;

class PoFileDumperTest extends TestCase
{
    public function testFormatCatalogue()
    {
        $catalogue = new MessageCatalogue('en');
        $catalogue->add(['foo' => 'bar', 'bar' => 'foo', 'foo_bar' => 'foobar', 'bar_foo' => 'barfoo']);
        $catalogue->setMetadata('foo_bar', [
            'comments' => [
                'Comment 1',
                'Comment 2',
            ],
            'flags' => [
                'fuzzy',
                'another',
            ],
            'sources' => [
                'src/file_1',
                'src/file_2:50',
            ],
        ]);
        $catalogue->setMetadata('bar_foo', [
            'comments' => 'Comment',
            'flags' => 'fuzzy',
            'sources' => 'src/file_1',
        ]);

        $dumper = new PoFileDumper();

        $this->assertStringEqualsFile(__DIR__.'/../fixtures/resources.po', $dumper->formatCatalogue($catalogue, 'messages'));
    }
}

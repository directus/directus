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
use Symfony\Component\Translation\Dumper\QtFileDumper;
use Symfony\Component\Translation\MessageCatalogue;

class QtFileDumperTest extends TestCase
{
    public function testFormatCatalogue()
    {
        $catalogue = new MessageCatalogue('en');
        $catalogue->add(['foo' => 'bar', 'foo_bar' => 'foobar', 'bar_foo' => 'barfoo'], 'resources');
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
        ], 'resources');
        $catalogue->setMetadata('bar_foo', [
            'comments' => 'Comment',
            'flags' => 'fuzzy',
            'sources' => 'src/file_1',
        ], 'resources');

        $dumper = new QtFileDumper();

        $this->assertStringEqualsFile(__DIR__.'/../fixtures/resources.ts', $dumper->formatCatalogue($catalogue, 'resources'));
    }
}

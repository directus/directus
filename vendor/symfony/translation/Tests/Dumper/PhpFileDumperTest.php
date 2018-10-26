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
use Symfony\Component\Translation\Dumper\PhpFileDumper;
use Symfony\Component\Translation\MessageCatalogue;

class PhpFileDumperTest extends TestCase
{
    public function testFormatCatalogue()
    {
        $catalogue = new MessageCatalogue('en');
        $catalogue->add(array('foo' => 'bar'));

        $dumper = new PhpFileDumper();

        $this->assertStringEqualsFile(__DIR__.'/../fixtures/resources.php', $dumper->formatCatalogue($catalogue, 'messages'));
    }
}

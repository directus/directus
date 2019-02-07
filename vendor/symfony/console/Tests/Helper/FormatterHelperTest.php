<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Console\Tests\Helper;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Helper\FormatterHelper;

class FormatterHelperTest extends TestCase
{
    public function testFormatSection()
    {
        $formatter = new FormatterHelper();

        $this->assertEquals(
            '<info>[cli]</info> Some text to display',
            $formatter->formatSection('cli', 'Some text to display'),
            '::formatSection() formats a message in a section'
        );
    }

    public function testFormatBlock()
    {
        $formatter = new FormatterHelper();

        $this->assertEquals(
            '<error> Some text to display </error>',
            $formatter->formatBlock('Some text to display', 'error'),
            '::formatBlock() formats a message in a block'
        );

        $this->assertEquals(
            '<error> Some text to display </error>'."\n".
            '<error> foo bar              </error>',
            $formatter->formatBlock(['Some text to display', 'foo bar'], 'error'),
            '::formatBlock() formats a message in a block'
        );

        $this->assertEquals(
            '<error>                        </error>'."\n".
            '<error>  Some text to display  </error>'."\n".
            '<error>                        </error>',
            $formatter->formatBlock('Some text to display', 'error', true),
            '::formatBlock() formats a message in a block'
        );
    }

    public function testFormatBlockWithDiacriticLetters()
    {
        $formatter = new FormatterHelper();

        $this->assertEquals(
            '<error>                       </error>'."\n".
            '<error>  Du texte à afficher  </error>'."\n".
            '<error>                       </error>',
            $formatter->formatBlock('Du texte à afficher', 'error', true),
            '::formatBlock() formats a message in a block'
        );
    }

    public function testFormatBlockWithDoubleWidthDiacriticLetters()
    {
        $formatter = new FormatterHelper();
        $this->assertEquals(
            '<error>                    </error>'."\n".
            '<error>  表示するテキスト  </error>'."\n".
            '<error>                    </error>',
            $formatter->formatBlock('表示するテキスト', 'error', true),
            '::formatBlock() formats a message in a block'
        );
    }

    public function testFormatBlockLGEscaping()
    {
        $formatter = new FormatterHelper();

        $this->assertEquals(
            '<error>                            </error>'."\n".
            '<error>  \<info>some info\</info>  </error>'."\n".
            '<error>                            </error>',
            $formatter->formatBlock('<info>some info</info>', 'error', true),
            '::formatBlock() escapes \'<\' chars'
        );
    }

    public function testTruncatingWithShorterLengthThanMessageWithSuffix()
    {
        $formatter = new FormatterHelper();
        $message = 'testing truncate';

        $this->assertSame('test...', $formatter->truncate($message, 4));
        $this->assertSame('testing truncat...', $formatter->truncate($message, 15));
        $this->assertSame('testing truncate...', $formatter->truncate($message, 16));
        $this->assertSame('zażółć gęślą...', $formatter->truncate('zażółć gęślą jaźń', 12));
    }

    public function testTruncatingMessageWithCustomSuffix()
    {
        $formatter = new FormatterHelper();
        $message = 'testing truncate';

        $this->assertSame('test!', $formatter->truncate($message, 4, '!'));
    }

    public function testTruncatingWithLongerLengthThanMessageWithSuffix()
    {
        $formatter = new FormatterHelper();
        $message = 'test';

        $this->assertSame($message, $formatter->truncate($message, 10));
    }

    public function testTruncatingWithNegativeLength()
    {
        $formatter = new FormatterHelper();
        $message = 'testing truncate';

        $this->assertSame('testing tru...', $formatter->truncate($message, -5));
        $this->assertSame('...', $formatter->truncate($message, -100));
    }
}

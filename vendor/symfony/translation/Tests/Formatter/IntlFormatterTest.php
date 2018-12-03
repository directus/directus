<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Translation\Tests\Formatter;

use Symfony\Component\Translation\Exception\InvalidArgumentException;
use Symfony\Component\Translation\Formatter\IntlFormatter;
use Symfony\Component\Translation\Formatter\IntlFormatterInterface;

/**
 * @requires extension intl
 */
class IntlFormatterTest extends \PHPUnit\Framework\TestCase
{
    /**
     * @dataProvider provideDataForFormat
     */
    public function testFormat($expected, $message, $arguments)
    {
        $this->assertEquals($expected, trim((new IntlFormatter())->formatIntl($message, 'en', $arguments)));
    }

    public function testInvalidFormat()
    {
        $this->expectException(InvalidArgumentException::class);
        (new IntlFormatter())->formatIntl('{foo', 'en', array(2));
    }

    public function testFormatWithNamedArguments()
    {
        if (version_compare(INTL_ICU_VERSION, '4.8', '<')) {
            $this->markTestSkipped('Format with named arguments can only be run with ICU 4.8 or higher and PHP >= 5.5');
        }

        $chooseMessage = <<<'_MSG_'
{gender_of_host, select,
  female {{num_guests, plural, offset:1
      =0 {{host} does not give a party.}
      =1 {{host} invites {guest} to her party.}
      =2 {{host} invites {guest} and one other person to her party.}
     other {{host} invites {guest} as one of the # people invited to her party.}}}
  male   {{num_guests, plural, offset:1
      =0 {{host} does not give a party.}
      =1 {{host} invites {guest} to his party.}
      =2 {{host} invites {guest} and one other person to his party.}
     other {{host} invites {guest} as one of the # people invited to his party.}}}
  other {{num_guests, plural, offset:1
      =0 {{host} does not give a party.}
      =1 {{host} invites {guest} to their party.}
      =2 {{host} invites {guest} and one other person to their party.}
     other {{host} invites {guest} as one of the # people invited to their party.}}}}
_MSG_;

        $message = (new IntlFormatter())->formatIntl($chooseMessage, 'en', array(
            'gender_of_host' => 'male',
            'num_guests' => 10,
            'host' => 'Fabien',
            'guest' => 'Guilherme',
        ));

        $this->assertEquals('Fabien invites Guilherme as one of the 9 people invited to his party.', $message);
    }

    public function provideDataForFormat()
    {
        return array(
            array(
                'There is one apple',
                'There is one apple',
                array(),
            ),
            array(
                '4,560 monkeys on 123 trees make 37.073 monkeys per tree',
                '{0,number,integer} monkeys on {1,number,integer} trees make {2,number} monkeys per tree',
                array(4560, 123, 4560 / 123),
            ),
        );
    }

    public function testPercentsAndBracketsAreTrimmed()
    {
        $formatter = new IntlFormatter();
        $this->assertInstanceof(IntlFormatterInterface::class, $formatter);
        $this->assertSame('Hello Fab', $formatter->formatIntl('Hello {name}', 'en', array('name' => 'Fab')));
        $this->assertSame('Hello Fab', $formatter->formatIntl('Hello {name}', 'en', array('%name%' => 'Fab')));
        $this->assertSame('Hello Fab', $formatter->formatIntl('Hello {name}', 'en', array('{{ name }}' => 'Fab')));
    }
}

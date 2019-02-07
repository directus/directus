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

use PHPUnit\Framework\TestCase;
use Symfony\Component\Translation\Formatter\MessageFormatter;

class MessageFormatterTest extends TestCase
{
    /**
     * @dataProvider getTransMessages
     */
    public function testFormat($expected, $message, $parameters = [])
    {
        $this->assertEquals($expected, $this->getMessageFormatter()->format($message, 'en', $parameters));
    }

    /**
     * @dataProvider getTransChoiceMessages
     * @group legacy
     */
    public function testFormatPlural($expected, $message, $number, $parameters)
    {
        $this->assertEquals($expected, $this->getMessageFormatter()->choiceFormat($message, $number, 'fr', $parameters));
    }

    public function getTransMessages()
    {
        return [
            [
                'There is one apple',
                'There is one apple',
            ],
            [
                'There are 5 apples',
                'There are %count% apples',
                ['%count%' => 5],
            ],
            [
                'There are 5 apples',
                'There are {{count}} apples',
                ['{{count}}' => 5],
            ],
        ];
    }

    public function getTransChoiceMessages()
    {
        return [
            ['Il y a 0 pomme', '[0,1] Il y a %count% pomme|]1,Inf] Il y a %count% pommes', 0, ['%count%' => 0]],
            ['Il y a 1 pomme', '[0,1] Il y a %count% pomme|]1,Inf] Il y a %count% pommes', 1, ['%count%' => 1]],
            ['Il y a 10 pommes', '[0,1] Il y a %count% pomme|]1,Inf] Il y a %count% pommes', 10, ['%count%' => 10]],

            ['Il y a 0 pomme', 'Il y a %count% pomme|Il y a %count% pommes', 0, ['%count%' => 0]],
            ['Il y a 1 pomme', 'Il y a %count% pomme|Il y a %count% pommes', 1, ['%count%' => 1]],
            ['Il y a 10 pommes', 'Il y a %count% pomme|Il y a %count% pommes', 10, ['%count%' => 10]],

            ['Il y a 0 pomme', 'one: Il y a %count% pomme|more: Il y a %count% pommes', 0, ['%count%' => 0]],
            ['Il y a 1 pomme', 'one: Il y a %count% pomme|more: Il y a %count% pommes', 1, ['%count%' => 1]],
            ['Il y a 10 pommes', 'one: Il y a %count% pomme|more: Il y a %count% pommes', 10, ['%count%' => 10]],

            ['Il n\'y a aucune pomme', '{0} Il n\'y a aucune pomme|one: Il y a %count% pomme|more: Il y a %count% pommes', 0, ['%count%' => 0]],
            ['Il y a 1 pomme', '{0} Il n\'y a aucune pomme|one: Il y a %count% pomme|more: Il y a %count% pommes', 1, ['%count%' => 1]],
            ['Il y a 10 pommes', '{0} Il n\'y a aucune pomme|one: Il y a %count% pomme|more: Il y a %count% pommes', 10, ['%count%' => 10]],

            ['Il y a 0 pomme', '[0,1] Il y a %count% pomme|]1,Inf] Il y a %count% pommes', 0, ['%count%' => 0]],
        ];
    }

    private function getMessageFormatter()
    {
        return new MessageFormatter();
    }
}

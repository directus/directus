<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Translation\Tests;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Translation\MessageSelector;

/**
 * @group legacy
 */
class MessageSelectorTest extends TestCase
{
    /**
     * @dataProvider getChooseTests
     */
    public function testChoose($expected, $id, $number)
    {
        $selector = new MessageSelector();

        $this->assertEquals($expected, $selector->choose($id, $number, 'en'));
    }

    public function testReturnMessageIfExactlyOneStandardRuleIsGiven()
    {
        $selector = new MessageSelector();

        $this->assertEquals('There are two apples', $selector->choose('There are two apples', 2, 'en'));
    }

    /**
     * @dataProvider getNonMatchingMessages
     * @expectedException \Symfony\Component\Translation\Exception\InvalidArgumentException
     */
    public function testThrowExceptionIfMatchingMessageCannotBeFound($id, $number)
    {
        $selector = new MessageSelector();

        $selector->choose($id, $number, 'en');
    }

    public function getNonMatchingMessages()
    {
        return array(
            array('{0} There are no apples|{1} There is one apple', 2),
            array('{1} There is one apple|]1,Inf] There are %count% apples', 0),
            array('{1} There is one apple|]2,Inf] There are %count% apples', 2),
            array('{0} There are no apples|There is one apple', 2),
        );
    }

    public function getChooseTests()
    {
        return array(
            array('There are no apples', '{0} There are no apples|{1} There is one apple|]1,Inf] There are %count% apples', 0),
            array('There are no apples', '{0}     There are no apples|{1} There is one apple|]1,Inf] There are %count% apples', 0),
            array('There are no apples', '{0}There are no apples|{1} There is one apple|]1,Inf] There are %count% apples', 0),

            array('There is one apple', '{0} There are no apples|{1} There is one apple|]1,Inf] There are %count% apples', 1),

            array('There are %count% apples', '{0} There are no apples|{1} There is one apple|]1,Inf] There are %count% apples', 10),
            array('There are %count% apples', '{0} There are no apples|{1} There is one apple|]1,Inf]There are %count% apples', 10),
            array('There are %count% apples', '{0} There are no apples|{1} There is one apple|]1,Inf]     There are %count% apples', 10),

            array('There are %count% apples', 'There is one apple|There are %count% apples', 0),
            array('There is one apple', 'There is one apple|There are %count% apples', 1),
            array('There are %count% apples', 'There is one apple|There are %count% apples', 10),

            array('There are %count% apples', 'one: There is one apple|more: There are %count% apples', 0),
            array('There is one apple', 'one: There is one apple|more: There are %count% apples', 1),
            array('There are %count% apples', 'one: There is one apple|more: There are %count% apples', 10),

            array('There are no apples', '{0} There are no apples|one: There is one apple|more: There are %count% apples', 0),
            array('There is one apple', '{0} There are no apples|one: There is one apple|more: There are %count% apples', 1),
            array('There are %count% apples', '{0} There are no apples|one: There is one apple|more: There are %count% apples', 10),

            array('', '{0}|{1} There is one apple|]1,Inf] There are %count% apples', 0),
            array('', '{0} There are no apples|{1}|]1,Inf] There are %count% apples', 1),

            // Indexed only tests which are Gettext PoFile* compatible strings.
            array('There are %count% apples', 'There is one apple|There are %count% apples', 0),
            array('There is one apple', 'There is one apple|There are %count% apples', 1),
            array('There are %count% apples', 'There is one apple|There are %count% apples', 2),

            // Tests for float numbers
            array('There is almost one apple', '{0} There are no apples|]0,1[ There is almost one apple|{1} There is one apple|[1,Inf] There is more than one apple', 0.7),
            array('There is one apple', '{0} There are no apples|]0,1[There are %count% apples|{1} There is one apple|[1,Inf] There is more than one apple', 1),
            array('There is more than one apple', '{0} There are no apples|]0,1[There are %count% apples|{1} There is one apple|[1,Inf] There is more than one apple', 1.7),
            array('There are no apples', '{0} There are no apples|]0,1[There are %count% apples|{1} There is one apple|[1,Inf] There is more than one apple', 0),
            array('There are no apples', '{0} There are no apples|]0,1[There are %count% apples|{1} There is one apple|[1,Inf] There is more than one apple', 0.0),
            array('There are no apples', '{0.0} There are no apples|]0,1[There are %count% apples|{1} There is one apple|[1,Inf] There is more than one apple', 0),

            // Test texts with new-lines
            // with double-quotes and \n in id & double-quotes and actual newlines in text
            array("This is a text with a\n            new-line in it. Selector = 0.", '{0}This is a text with a
            new-line in it. Selector = 0.|{1}This is a text with a
            new-line in it. Selector = 1.|[1,Inf]This is a text with a
            new-line in it. Selector > 1.', 0),
            // with double-quotes and \n in id and single-quotes and actual newlines in text
            array("This is a text with a\n            new-line in it. Selector = 1.", '{0}This is a text with a
            new-line in it. Selector = 0.|{1}This is a text with a
            new-line in it. Selector = 1.|[1,Inf]This is a text with a
            new-line in it. Selector > 1.', 1),
            array("This is a text with a\n            new-line in it. Selector > 1.", '{0}This is a text with a
            new-line in it. Selector = 0.|{1}This is a text with a
            new-line in it. Selector = 1.|[1,Inf]This is a text with a
            new-line in it. Selector > 1.', 5),
            // with double-quotes and id split accros lines
            array('This is a text with a
            new-line in it. Selector = 1.', '{0}This is a text with a
            new-line in it. Selector = 0.|{1}This is a text with a
            new-line in it. Selector = 1.|[1,Inf]This is a text with a
            new-line in it. Selector > 1.', 1),
            // with single-quotes and id split accros lines
            array('This is a text with a
            new-line in it. Selector > 1.', '{0}This is a text with a
            new-line in it. Selector = 0.|{1}This is a text with a
            new-line in it. Selector = 1.|[1,Inf]This is a text with a
            new-line in it. Selector > 1.', 5),
            // with single-quotes and \n in text
            array('This is a text with a\nnew-line in it. Selector = 0.', '{0}This is a text with a\nnew-line in it. Selector = 0.|{1}This is a text with a\nnew-line in it. Selector = 1.|[1,Inf]This is a text with a\nnew-line in it. Selector > 1.', 0),
            // with double-quotes and id split accros lines
            array("This is a text with a\nnew-line in it. Selector = 1.", "{0}This is a text with a\nnew-line in it. Selector = 0.|{1}This is a text with a\nnew-line in it. Selector = 1.|[1,Inf]This is a text with a\nnew-line in it. Selector > 1.", 1),
            // esacape pipe
            array('This is a text with | in it. Selector = 0.', '{0}This is a text with || in it. Selector = 0.|{1}This is a text with || in it. Selector = 1.', 0),
            // Empty plural set (2 plural forms) from a .PO file
            array('', '|', 1),
            // Empty plural set (3 plural forms) from a .PO file
            array('', '||', 1),
        );
    }
}

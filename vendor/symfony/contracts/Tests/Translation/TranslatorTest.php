<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Contracts\Tests\Translation;

use PHPUnit\Framework\TestCase;
use Symfony\Contracts\Translation\TranslatorInterface;
use Symfony\Contracts\Translation\TranslatorTrait;

/**
 * Test should cover all languages mentioned on http://translate.sourceforge.net/wiki/l10n/pluralforms
 * and Plural forms mentioned on http://www.gnu.org/software/gettext/manual/gettext.html#Plural-forms.
 *
 * See also https://developer.mozilla.org/en/Localization_and_Plurals which mentions 15 rules having a maximum of 6 forms.
 * The mozilla code is also interesting to check for.
 *
 * As mentioned by chx http://drupal.org/node/1273968 we can cover all by testing number from 0 to 199
 *
 * The goal to cover all languages is to far fetched so this test case is smaller.
 *
 * @author Clemens Tolboom clemens@build2be.nl
 */
class TranslatorTest extends TestCase
{
    public function getTranslator()
    {
        return new class() implements TranslatorInterface {
            use TranslatorTrait;
        };
    }

    /**
     * @dataProvider getTransTests
     */
    public function testTrans($expected, $id, $parameters)
    {
        $translator = $this->getTranslator();

        $this->assertEquals($expected, $translator->trans($id, $parameters));
    }

    /**
     * @dataProvider getTransChoiceTests
     */
    public function testTransChoiceWithExplicitLocale($expected, $id, $number)
    {
        $translator = $this->getTranslator();
        $translator->setLocale('en');

        $this->assertEquals($expected, $translator->trans($id, array('%count%' => $number)));
    }

    /**
     * @dataProvider getTransChoiceTests
     */
    public function testTransChoiceWithDefaultLocale($expected, $id, $number)
    {
        \Locale::setDefault('en');

        $translator = $this->getTranslator();

        $this->assertEquals($expected, $translator->trans($id, array('%count%' => $number)));
    }

    public function testGetSetLocale()
    {
        $translator = $this->getTranslator();
        $translator->setLocale('en');

        $this->assertEquals('en', $translator->getLocale());
    }

    /**
     * @requires extension intl
     */
    public function testGetLocaleReturnsDefaultLocaleIfNotSet()
    {
        $translator = $this->getTranslator();

        \Locale::setDefault('pt_BR');
        $this->assertEquals('pt_BR', $translator->getLocale());

        \Locale::setDefault('en');
        $this->assertEquals('en', $translator->getLocale());
    }

    public function getTransTests()
    {
        return array(
            array('Symfony is great!', 'Symfony is great!', array()),
            array('Symfony is awesome!', 'Symfony is %what%!', array('%what%' => 'awesome')),
        );
    }

    public function getTransChoiceTests()
    {
        return array(
            array('There are no apples', '{0} There are no apples|{1} There is one apple|]1,Inf] There are %count% apples', 0),
            array('There is one apple', '{0} There are no apples|{1} There is one apple|]1,Inf] There are %count% apples', 1),
            array('There are 10 apples', '{0} There are no apples|{1} There is one apple|]1,Inf] There are %count% apples', 10),
            array('There are 0 apples', 'There is 1 apple|There are %count% apples', 0),
            array('There is 1 apple', 'There is 1 apple|There are %count% apples', 1),
            array('There are 10 apples', 'There is 1 apple|There are %count% apples', 10),
            // custom validation messages may be coded with a fixed value
            array('There are 2 apples', 'There are 2 apples', 2),
        );
    }

    /**
     * @dataProvider getInternal
     */
    public function testInterval($expected, $number, $interval)
    {
        $translator = $this->getTranslator();

        $this->assertEquals($expected, $translator->trans($interval.' foo|[1,Inf[ bar', array('%count%' => $number)));
    }

    public function getInternal()
    {
        return array(
            array('foo', 3, '{1,2, 3 ,4}'),
            array('bar', 10, '{1,2, 3 ,4}'),
            array('bar', 3, '[1,2]'),
            array('foo', 1, '[1,2]'),
            array('foo', 2, '[1,2]'),
            array('bar', 1, ']1,2['),
            array('bar', 2, ']1,2['),
            array('foo', log(0), '[-Inf,2['),
            array('foo', -log(0), '[-2,+Inf]'),
        );
    }

    /**
     * @dataProvider getChooseTests
     */
    public function testChoose($expected, $id, $number)
    {
        $translator = $this->getTranslator();

        $this->assertEquals($expected, $translator->trans($id, array('%count%' => $number)));
    }

    public function testReturnMessageIfExactlyOneStandardRuleIsGiven()
    {
        $translator = $this->getTranslator();

        $this->assertEquals('There are two apples', $translator->trans('There are two apples', array('%count%' => 2)));
    }

    /**
     * @dataProvider getNonMatchingMessages
     * @expectedException \InvalidArgumentException
     */
    public function testThrowExceptionIfMatchingMessageCannotBeFound($id, $number)
    {
        $translator = $this->getTranslator();

        $translator->trans($id, array('%count%' => $number));
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

            array('There are 10 apples', '{0} There are no apples|{1} There is one apple|]1,Inf] There are %count% apples', 10),
            array('There are 10 apples', '{0} There are no apples|{1} There is one apple|]1,Inf]There are %count% apples', 10),
            array('There are 10 apples', '{0} There are no apples|{1} There is one apple|]1,Inf]     There are %count% apples', 10),

            array('There are 0 apples', 'There is one apple|There are %count% apples', 0),
            array('There is one apple', 'There is one apple|There are %count% apples', 1),
            array('There are 10 apples', 'There is one apple|There are %count% apples', 10),

            array('There are 0 apples', 'one: There is one apple|more: There are %count% apples', 0),
            array('There is one apple', 'one: There is one apple|more: There are %count% apples', 1),
            array('There are 10 apples', 'one: There is one apple|more: There are %count% apples', 10),

            array('There are no apples', '{0} There are no apples|one: There is one apple|more: There are %count% apples', 0),
            array('There is one apple', '{0} There are no apples|one: There is one apple|more: There are %count% apples', 1),
            array('There are 10 apples', '{0} There are no apples|one: There is one apple|more: There are %count% apples', 10),

            array('', '{0}|{1} There is one apple|]1,Inf] There are %count% apples', 0),
            array('', '{0} There are no apples|{1}|]1,Inf] There are %count% apples', 1),

            // Indexed only tests which are Gettext PoFile* compatible strings.
            array('There are 0 apples', 'There is one apple|There are %count% apples', 0),
            array('There is one apple', 'There is one apple|There are %count% apples', 1),
            array('There are 2 apples', 'There is one apple|There are %count% apples', 2),

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

    /**
     * @dataProvider failingLangcodes
     */
    public function testFailedLangcodes($nplural, $langCodes)
    {
        $matrix = $this->generateTestData($langCodes);
        $this->validateMatrix($nplural, $matrix, false);
    }

    /**
     * @dataProvider successLangcodes
     */
    public function testLangcodes($nplural, $langCodes)
    {
        $matrix = $this->generateTestData($langCodes);
        $this->validateMatrix($nplural, $matrix);
    }

    /**
     * This array should contain all currently known langcodes.
     *
     * As it is impossible to have this ever complete we should try as hard as possible to have it almost complete.
     *
     * @return array
     */
    public function successLangcodes()
    {
        return array(
            array('1', array('ay', 'bo', 'cgg', 'dz', 'id', 'ja', 'jbo', 'ka', 'kk', 'km', 'ko', 'ky')),
            array('2', array('nl', 'fr', 'en', 'de', 'de_GE', 'hy', 'hy_AM')),
            array('3', array('be', 'bs', 'cs', 'hr')),
            array('4', array('cy', 'mt', 'sl')),
            array('6', array('ar')),
        );
    }

    /**
     * This array should be at least empty within the near future.
     *
     * This both depends on a complete list trying to add above as understanding
     * the plural rules of the current failing languages.
     *
     * @return array with nplural together with langcodes
     */
    public function failingLangcodes()
    {
        return array(
            array('1', array('fa')),
            array('2', array('jbo')),
            array('3', array('cbs')),
            array('4', array('gd', 'kw')),
            array('5', array('ga')),
        );
    }

    /**
     * We validate only on the plural coverage. Thus the real rules is not tested.
     *
     * @param string $nplural       Plural expected
     * @param array  $matrix        Containing langcodes and their plural index values
     * @param bool   $expectSuccess
     */
    protected function validateMatrix($nplural, $matrix, $expectSuccess = true)
    {
        foreach ($matrix as $langCode => $data) {
            $indexes = array_flip($data);
            if ($expectSuccess) {
                $this->assertEquals($nplural, \count($indexes), "Langcode '$langCode' has '$nplural' plural forms.");
            } else {
                $this->assertNotEquals((int) $nplural, \count($indexes), "Langcode '$langCode' has '$nplural' plural forms.");
            }
        }
    }

    protected function generateTestData($langCodes)
    {
        $translator = new class() {
            use TranslatorTrait {
                getPluralizationRule as public;
            }
        };

        $matrix = array();
        foreach ($langCodes as $langCode) {
            for ($count = 0; $count < 200; ++$count) {
                $plural = $translator->getPluralizationRule($count, $langCode);
                $matrix[$langCode][$count] = $plural;
            }
        }

        return $matrix;
    }
}

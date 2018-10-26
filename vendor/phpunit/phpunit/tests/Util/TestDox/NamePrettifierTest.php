<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Util_TestDox_NamePrettifierTest extends PHPUnit_Framework_TestCase
{
    protected $namePrettifier;

    protected function setUp()
    {
        $this->namePrettifier = new PHPUnit_Util_TestDox_NamePrettifier;
    }

    public function testTitleHasSensibleDefaults()
    {
        $this->assertEquals('Foo', $this->namePrettifier->prettifyTestClass('FooTest'));
        $this->assertEquals('Foo', $this->namePrettifier->prettifyTestClass('TestFoo'));
        $this->assertEquals('Foo', $this->namePrettifier->prettifyTestClass('TestFooTest'));
        $this->assertEquals('Foo', $this->namePrettifier->prettifyTestClass('Test\FooTest'));
    }

    public function testCaterForUserDefinedSuffix()
    {
        $this->namePrettifier->setSuffix('TestCase');
        $this->namePrettifier->setPrefix(null);

        $this->assertEquals('Foo', $this->namePrettifier->prettifyTestClass('FooTestCase'));
        $this->assertEquals('TestFoo', $this->namePrettifier->prettifyTestClass('TestFoo'));
        $this->assertEquals('FooTest', $this->namePrettifier->prettifyTestClass('FooTest'));
    }

    public function testCaterForUserDefinedPrefix()
    {
        $this->namePrettifier->setSuffix(null);
        $this->namePrettifier->setPrefix('XXX');

        $this->assertEquals('Foo', $this->namePrettifier->prettifyTestClass('XXXFoo'));
        $this->assertEquals('TestXXX', $this->namePrettifier->prettifyTestClass('TestXXX'));
        $this->assertEquals('XXX', $this->namePrettifier->prettifyTestClass('XXXXXX'));
    }

    public function testTestNameIsConvertedToASentence()
    {
        $this->assertEquals('This is a test', $this->namePrettifier->prettifyTestMethod('testThisIsATest'));
        $this->assertEquals('This is a test', $this->namePrettifier->prettifyTestMethod('testThisIsATest2'));
        $this->assertEquals('This is a test', $this->namePrettifier->prettifyTestMethod('this_is_a_test'));
        $this->assertEquals('Foo for bar is 0', $this->namePrettifier->prettifyTestMethod('testFooForBarIs0'));
        $this->assertEquals('Foo for baz is 1', $this->namePrettifier->prettifyTestMethod('testFooForBazIs1'));
        $this->assertEquals('', $this->namePrettifier->prettifyTestMethod('test'));
    }

    /**
     * @ticket 224
     */
    public function testTestNameIsNotGroupedWhenNotInSequence()
    {
        $this->assertEquals('Sets redirect header on 301', $this->namePrettifier->prettifyTestMethod('testSetsRedirectHeaderOn301'));
        $this->assertEquals('Sets redirect header on 302', $this->namePrettifier->prettifyTestMethod('testSetsRedirectHeaderOn302'));
    }
}

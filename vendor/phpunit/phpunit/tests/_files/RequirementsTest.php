<?php
class RequirementsTest extends PHPUnit_Framework_TestCase
{
    public function testOne()
    {
    }

    /**
     * @requires PHPUnit 1.0
     */
    public function testTwo()
    {
    }

    /**
     * @requires PHP 2.0
     */
    public function testThree()
    {
    }

    /**
     * @requires PHPUnit 2.0
     * @requires PHP 1.0
     */
    public function testFour()
    {
    }

    /**
     * @requires PHP 5.4.0RC6
     */
    public function testFive()
    {
    }

    /**
     * @requires PHP 5.4.0-alpha1
     */
    public function testSix()
    {
    }

    /**
     * @requires PHP 5.4.0beta2
     */
    public function testSeven()
    {
    }

    /**
     * @requires PHP 5.4-dev
     */
    public function testEight()
    {
    }

    /**
     * @requires function testFunc
     */
    public function testNine()
    {
    }

    /**
     * @requires extension testExt
     */
    public function testTen()
    {
    }

    /**
     * @requires OS Linux
     */
    public function testEleven()
    {
    }

    /**
     * @requires PHP 99-dev
     * @requires PHPUnit 9-dev
     * @requires OS DOESNOTEXIST
     * @requires function testFuncOne
     * @requires function testFuncTwo
     * @requires extension testExtOne
     * @requires extension testExtTwo
     * @requires extension testExtThree 2.0
     */
    public function testAllPossibleRequirements()
    {
    }

    /**
     * @requires function array_merge
     */
    public function testExistingFunction()
    {
    }

    /**
     * @requires function ReflectionMethod::setAccessible
     */
    public function testExistingMethod()
    {
    }

    /**
     * @requires extension spl
     */
    public function testExistingExtension()
    {
    }

    /**
     * @requires OS .*
     */
    public function testExistingOs()
    {
    }

    /**
     * @requires PHPUnit 1111111
     */
    public function testAlwaysSkip()
    {
    }

    /**
     * @requires PHP 9999999
     */
    public function testAlwaysSkip2()
    {
    }

    /**
     * @requires OS DOESNOTEXIST
     */
    public function testAlwaysSkip3()
    {
    }

    /**
     * @requires	  extension	  spl
     * @requires	  OS	  .*
     */
    public function testSpace()
    {
    }

    /**
     * @requires extension testExt 1.8.0
     */
    public function testSpecificExtensionVersion()
    {
    }

    /**
     * @requires PHP < 5.4
     */
    public function testPHPVersionOperatorLessThan()
    {
    }

    /**
     * @requires PHP <= 5.4
     */
    public function testPHPVersionOperatorLessThanEquals()
    {
    }

    /**
     * @requires PHP > 99
     */
    public function testPHPVersionOperatorGreaterThan()
    {
    }

    /**
     * @requires PHP >= 99
     */
    public function testPHPVersionOperatorGreaterThanEquals()
    {
    }

    /**
     * @requires PHP = 5.4
     */
    public function testPHPVersionOperatorEquals()
    {
    }

    /**
     * @requires PHP == 5.4
     */
    public function testPHPVersionOperatorDoubleEquals()
    {
    }

    /**
     * @requires PHP != 99
     */
    public function testPHPVersionOperatorBangEquals()
    {
    }

    /**
     * @requires PHP <> 99
     */
    public function testPHPVersionOperatorNotEquals()
    {
    }

    /**
     * @requires PHP >=99
     */
    public function testPHPVersionOperatorNoSpace()
    {
    }

    /**
     * @requires PHPUnit < 1.0
     */
    public function testPHPUnitVersionOperatorLessThan()
    {
    }

    /**
     * @requires PHPUnit <= 1.0
     */
    public function testPHPUnitVersionOperatorLessThanEquals()
    {
    }

    /**
     * @requires PHPUnit > 99
     */
    public function testPHPUnitVersionOperatorGreaterThan()
    {
    }

    /**
     * @requires PHPUnit >= 99
     */
    public function testPHPUnitVersionOperatorGreaterThanEquals()
    {
    }

    /**
     * @requires PHPUnit = 1.0
     */
    public function testPHPUnitVersionOperatorEquals()
    {
    }

    /**
     * @requires PHPUnit == 1.0
     */
    public function testPHPUnitVersionOperatorDoubleEquals()
    {
    }

    /**
     * @requires PHPUnit != 99
     */
    public function testPHPUnitVersionOperatorBangEquals()
    {
    }

    /**
     * @requires PHPUnit <> 99
     */
    public function testPHPUnitVersionOperatorNotEquals()
    {
    }

    /**
     * @requires PHPUnit >=99
     */
    public function testPHPUnitVersionOperatorNoSpace()
    {
    }

    /**
     * @requires extension testExtOne < 1.0
     */
    public function testExtensionVersionOperatorLessThan()
    {
    }

    /**
     * @requires extension testExtOne <= 1.0
     */
    public function testExtensionVersionOperatorLessThanEquals()
    {
    }

    /**
     * @requires extension testExtOne > 99
     */
    public function testExtensionVersionOperatorGreaterThan()
    {
    }

    /**
     * @requires extension testExtOne >= 99
     */
    public function testExtensionVersionOperatorGreaterThanEquals()
    {
    }

    /**
     * @requires extension testExtOne = 1.0
     */
    public function testExtensionVersionOperatorEquals()
    {
    }

    /**
     * @requires extension testExtOne == 1.0
     */
    public function testExtensionVersionOperatorDoubleEquals()
    {
    }

    /**
     * @requires extension testExtOne != 99
     */
    public function testExtensionVersionOperatorBangEquals()
    {
    }

    /**
     * @requires extension testExtOne <> 99
     */
    public function testExtensionVersionOperatorNotEquals()
    {
    }

    /**
     * @requires extension testExtOne >=99
     */
    public function testExtensionVersionOperatorNoSpace()
    {
    }
}

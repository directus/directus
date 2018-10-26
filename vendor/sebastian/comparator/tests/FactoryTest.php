<?php
/*
 * This file is part of the Comparator package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\Comparator;

/**
 * @coversDefaultClass SebastianBergmann\Comparator\Factory
 *
 */
class FactoryTest extends \PHPUnit_Framework_TestCase
{
    public function instanceProvider()
    {
        $tmpfile = tmpfile();

        return array(
            array(NULL, NULL, 'SebastianBergmann\\Comparator\\ScalarComparator'),
            array(NULL, TRUE, 'SebastianBergmann\\Comparator\\ScalarComparator'),
            array(TRUE, NULL, 'SebastianBergmann\\Comparator\\ScalarComparator'),
            array(TRUE, TRUE, 'SebastianBergmann\\Comparator\\ScalarComparator'),
            array(FALSE, FALSE, 'SebastianBergmann\\Comparator\\ScalarComparator'),
            array(TRUE, FALSE, 'SebastianBergmann\\Comparator\\ScalarComparator'),
            array(FALSE, TRUE, 'SebastianBergmann\\Comparator\\ScalarComparator'),
            array('', '', 'SebastianBergmann\\Comparator\\ScalarComparator'),
            array('0', '0', 'SebastianBergmann\\Comparator\\ScalarComparator'),
            array('0', 0, 'SebastianBergmann\\Comparator\\NumericComparator'),
            array(0, '0', 'SebastianBergmann\\Comparator\\NumericComparator'),
            array(0, 0, 'SebastianBergmann\\Comparator\\NumericComparator'),
            array(1.0, 0, 'SebastianBergmann\\Comparator\\DoubleComparator'),
            array(0, 1.0, 'SebastianBergmann\\Comparator\\DoubleComparator'),
            array(1.0, 1.0, 'SebastianBergmann\\Comparator\\DoubleComparator'),
            array(array(1), array(1), 'SebastianBergmann\\Comparator\\ArrayComparator'),
            array($tmpfile, $tmpfile, 'SebastianBergmann\\Comparator\\ResourceComparator'),
            array(new \stdClass, new \stdClass, 'SebastianBergmann\\Comparator\\ObjectComparator'),
            array(new \DateTime, new \DateTime, 'SebastianBergmann\\Comparator\\DateTimeComparator'),
            array(new \SplObjectStorage, new \SplObjectStorage, 'SebastianBergmann\\Comparator\\SplObjectStorageComparator'),
            array(new \Exception, new \Exception, 'SebastianBergmann\\Comparator\\ExceptionComparator'),
            array(new \DOMDocument, new \DOMDocument, 'SebastianBergmann\\Comparator\\DOMNodeComparator'),
            // mixed types
            array($tmpfile, array(1), 'SebastianBergmann\\Comparator\\TypeComparator'),
            array(array(1), $tmpfile, 'SebastianBergmann\\Comparator\\TypeComparator'),
            array($tmpfile, '1', 'SebastianBergmann\\Comparator\\TypeComparator'),
            array('1', $tmpfile, 'SebastianBergmann\\Comparator\\TypeComparator'),
            array($tmpfile, new \stdClass, 'SebastianBergmann\\Comparator\\TypeComparator'),
            array(new \stdClass, $tmpfile, 'SebastianBergmann\\Comparator\\TypeComparator'),
            array(new \stdClass, array(1), 'SebastianBergmann\\Comparator\\TypeComparator'),
            array(array(1), new \stdClass, 'SebastianBergmann\\Comparator\\TypeComparator'),
            array(new \stdClass, '1', 'SebastianBergmann\\Comparator\\TypeComparator'),
            array('1', new \stdClass, 'SebastianBergmann\\Comparator\\TypeComparator'),
            array(new ClassWithToString, '1', 'SebastianBergmann\\Comparator\\ScalarComparator'),
            array('1', new ClassWithToString, 'SebastianBergmann\\Comparator\\ScalarComparator'),
            array(1.0, new \stdClass, 'SebastianBergmann\\Comparator\\TypeComparator'),
            array(new \stdClass, 1.0, 'SebastianBergmann\\Comparator\\TypeComparator'),
            array(1.0, array(1), 'SebastianBergmann\\Comparator\\TypeComparator'),
            array(array(1), 1.0, 'SebastianBergmann\\Comparator\\TypeComparator'),
        );
    }

    /**
     * @dataProvider instanceProvider
     * @covers       ::getComparatorFor
     * @covers       ::__construct
     */
    public function testGetComparatorFor($a, $b, $expected)
    {
        $factory = new Factory;
        $actual = $factory->getComparatorFor($a, $b);
        $this->assertInstanceOf($expected, $actual);
    }

    /**
     * @covers ::register
     */
    public function testRegister()
    {
        $comparator = new TestClassComparator;

        $factory = new Factory;
        $factory->register($comparator);

        $a = new TestClass;
        $b = new TestClass;
        $expected = 'SebastianBergmann\\Comparator\\TestClassComparator';
        $actual = $factory->getComparatorFor($a, $b);

        $factory->unregister($comparator);
        $this->assertInstanceOf($expected, $actual);
    }

    /**
     * @covers ::unregister
     */
    public function testUnregister()
    {
        $comparator = new TestClassComparator;

        $factory = new Factory;
        $factory->register($comparator);
        $factory->unregister($comparator);

        $a = new TestClass;
        $b = new TestClass;
        $expected = 'SebastianBergmann\\Comparator\\ObjectComparator';
        $actual = $factory->getComparatorFor($a, $b);

        $this->assertInstanceOf($expected, $actual);
    }
}

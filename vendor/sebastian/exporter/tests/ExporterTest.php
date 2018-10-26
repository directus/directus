<?php
/*
 * This file is part of the Exporter package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\Exporter;

/**
 * @covers SebastianBergmann\Exporter\Exporter
 */
class ExporterTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @var Exporter
     */
    private $exporter;

    protected function setUp()
    {
        $this->exporter = new Exporter;
    }

    public function exportProvider()
    {
        $obj2 = new \stdClass;
        $obj2->foo = 'bar';

        $obj3 = (object)array(1,2,"Test\r\n",4,5,6,7,8);

        $obj = new \stdClass;
        //@codingStandardsIgnoreStart
        $obj->null = null;
        //@codingStandardsIgnoreEnd
        $obj->boolean = true;
        $obj->integer = 1;
        $obj->double = 1.2;
        $obj->string = '1';
        $obj->text = "this\nis\na\nvery\nvery\nvery\nvery\nvery\nvery\rlong\n\rtext";
        $obj->object = $obj2;
        $obj->objectagain = $obj2;
        $obj->array = array('foo' => 'bar');
        $obj->self = $obj;

        $storage = new \SplObjectStorage;
        $storage->attach($obj2);
        $storage->foo = $obj2;

        return array(
            array(null, 'null'),
            array(true, 'true'),
            array(false, 'false'),
            array(1, '1'),
            array(1.0, '1.0'),
            array(1.2, '1.2'),
            array(fopen('php://memory', 'r'), 'resource(%d) of type (stream)'),
            array('1', "'1'"),
            array(array(array(1,2,3), array(3,4,5)),
        <<<EOF
Array &0 (
    0 => Array &1 (
        0 => 1
        1 => 2
        2 => 3
    )
    1 => Array &2 (
        0 => 3
        1 => 4
        2 => 5
    )
)
EOF
            ),
            // \n\r and \r is converted to \n
            array("this\nis\na\nvery\nvery\nvery\nvery\nvery\nvery\rlong\n\rtext",
            <<<EOF
'this
is
a
very
very
very
very
very
very
long
text'
EOF
            ),
            array(new \stdClass, 'stdClass Object &%x ()'),
            array($obj,
            <<<EOF
stdClass Object &%x (
    'null' => null
    'boolean' => true
    'integer' => 1
    'double' => 1.2
    'string' => '1'
    'text' => 'this
is
a
very
very
very
very
very
very
long
text'
    'object' => stdClass Object &%x (
        'foo' => 'bar'
    )
    'objectagain' => stdClass Object &%x
    'array' => Array &%d (
        'foo' => 'bar'
    )
    'self' => stdClass Object &%x
)
EOF
            ),
            array(array(), 'Array &%d ()'),
            array($storage,
            <<<EOF
SplObjectStorage Object &%x (
    'foo' => stdClass Object &%x (
        'foo' => 'bar'
    )
    '%x' => Array &0 (
        'obj' => stdClass Object &%x
        'inf' => null
    )
)
EOF
            ),
            array($obj3,
            <<<EOF
stdClass Object &%x (
    0 => 1
    1 => 2
    2 => 'Test\n'
    3 => 4
    4 => 5
    5 => 6
    6 => 7
    7 => 8
)
EOF
            ),
            array(
                chr(0) . chr(1) . chr(2) . chr(3) . chr(4) . chr(5),
                'Binary String: 0x000102030405'
            ),
            array(
                implode('', array_map('chr', range(0x0e, 0x1f))),
                'Binary String: 0x0e0f101112131415161718191a1b1c1d1e1f'
            ),
            array(
                chr(0x00) . chr(0x09),
                'Binary String: 0x0009'
            ),
            array(
                '',
                "''"
            ),
        );
    }

    /**
     * @dataProvider exportProvider
     */
    public function testExport($value, $expected)
    {
        $this->assertStringMatchesFormat(
            $expected,
            $this->trimNewline($this->exporter->export($value))
        );
    }

    public function testExport2()
    {
        if (PHP_VERSION === '5.3.3') {
            $this->markTestSkipped('Skipped due to "Nesting level too deep - recursive dependency?" fatal error');
        }

        $obj = new \stdClass;
        $obj->foo = 'bar';

        $array = array(
            0 => 0,
            'null' => null,
            'boolean' => true,
            'integer' => 1,
            'double' => 1.2,
            'string' => '1',
            'text' => "this\nis\na\nvery\nvery\nvery\nvery\nvery\nvery\rlong\n\rtext",
            'object' => $obj,
            'objectagain' => $obj,
            'array' => array('foo' => 'bar'),
        );

        $array['self'] = &$array;

        $expected = <<<EOF
Array &%d (
    0 => 0
    'null' => null
    'boolean' => true
    'integer' => 1
    'double' => 1.2
    'string' => '1'
    'text' => 'this
is
a
very
very
very
very
very
very
long
text'
    'object' => stdClass Object &%x (
        'foo' => 'bar'
    )
    'objectagain' => stdClass Object &%x
    'array' => Array &%d (
        'foo' => 'bar'
    )
    'self' => Array &%d (
        0 => 0
        'null' => null
        'boolean' => true
        'integer' => 1
        'double' => 1.2
        'string' => '1'
        'text' => 'this
is
a
very
very
very
very
very
very
long
text'
        'object' => stdClass Object &%x
        'objectagain' => stdClass Object &%x
        'array' => Array &%d (
            'foo' => 'bar'
        )
        'self' => Array &%d
    )
)
EOF;

        $this->assertStringMatchesFormat(
            $expected,
            $this->trimNewline($this->exporter->export($array))
        );
    }

    public function shortenedExportProvider()
    {
        $obj = new \stdClass;
        $obj->foo = 'bar';

        $array = array(
            'foo' => 'bar',
        );

        return array(
            array(null, 'null'),
            array(true, 'true'),
            array(1, '1'),
            array(1.0, '1.0'),
            array(1.2, '1.2'),
            array('1', "'1'"),
            // \n\r and \r is converted to \n
            array("this\nis\na\nvery\nvery\nvery\nvery\nvery\nvery\rlong\n\rtext", "'this\\nis\\na\\nvery\\nvery\\nvery\\nvery...g\\ntext'"),
            array(new \stdClass, 'stdClass Object ()'),
            array($obj, 'stdClass Object (...)'),
            array(array(), 'Array ()'),
            array($array, 'Array (...)'),
        );
    }

    /**
     * @dataProvider shortenedExportProvider
     */
    public function testShortenedExport($value, $expected)
    {
        $this->assertSame(
            $expected,
            $this->trimNewline($this->exporter->shortenedExport($value))
        );
    }

    /**
     * @requires extension mbstring
     */
    public function testShortenedExportForMultibyteCharacters()
    {
        $oldMbLanguage = mb_language();
        mb_language('Japanese');
        $oldMbInternalEncoding = mb_internal_encoding();
        mb_internal_encoding('UTF-8');

        try {
            $this->assertSame(
              "'いろはにほへとちりぬるをわかよたれそつねならむうゐのおくや...しゑひもせす'",
              $this->trimNewline($this->exporter->shortenedExport('いろはにほへとちりぬるをわかよたれそつねならむうゐのおくやまけふこえてあさきゆめみしゑひもせす'))
            );
        } catch (\Exception $e) {
            mb_internal_encoding($oldMbInternalEncoding);
            mb_language($oldMbLanguage);
            throw $e;
        }

        mb_internal_encoding($oldMbInternalEncoding);
        mb_language($oldMbLanguage);
    }

    public function provideNonBinaryMultibyteStrings()
    {
        return array(
            array(implode('', array_map('chr', range(0x09, 0x0d))), 5),
            array(implode('', array_map('chr', range(0x20, 0x7f))), 96),
            array(implode('', array_map('chr', range(0x80, 0xff))), 128),
        );
    }


    /**
     * @dataProvider provideNonBinaryMultibyteStrings
     */
    public function testNonBinaryStringExport($value, $expectedLength)
    {
        $this->assertRegExp(
            "~'.{{$expectedLength}}'\$~s",
            $this->exporter->export($value)
        );
    }

    public function testNonObjectCanBeReturnedAsArray()
    {
        $this->assertEquals(array(true), $this->exporter->toArray(true));
    }

    private function trimNewline($string)
    {
        return preg_replace('/[ ]*\n/', "\n", $string);
    }
}

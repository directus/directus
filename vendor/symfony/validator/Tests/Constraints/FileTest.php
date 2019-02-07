<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Tests\Constraints;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Constraints\File;
use Symfony\Component\Validator\Exception\ConstraintDefinitionException;

class FileTest extends TestCase
{
    /**
     * @dataProvider provideValidSizes
     */
    public function testMaxSize($maxSize, $bytes, $binaryFormat)
    {
        $file = new File(['maxSize' => $maxSize]);

        $this->assertSame($bytes, $file->maxSize);
        $this->assertSame($binaryFormat, $file->binaryFormat);
        $this->assertTrue($file->__isset('maxSize'));
    }

    public function testMagicIsset()
    {
        $file = new File(['maxSize' => 1]);

        $this->assertTrue($file->__isset('maxSize'));
        $this->assertTrue($file->__isset('groups'));
        $this->assertFalse($file->__isset('toto'));
    }

    /**
     * @dataProvider provideValidSizes
     */
    public function testMaxSizeCanBeSetAfterInitialization($maxSize, $bytes, $binaryFormat)
    {
        $file = new File();
        $file->maxSize = $maxSize;

        $this->assertSame($bytes, $file->maxSize);
        $this->assertSame($binaryFormat, $file->binaryFormat);
    }

    /**
     * @dataProvider provideInvalidSizes
     * @expectedException \Symfony\Component\Validator\Exception\ConstraintDefinitionException
     */
    public function testInvalidValueForMaxSizeThrowsExceptionAfterInitialization($maxSize)
    {
        $file = new File(['maxSize' => 1000]);
        $file->maxSize = $maxSize;
    }

    /**
     * @dataProvider provideInvalidSizes
     */
    public function testMaxSizeCannotBeSetToInvalidValueAfterInitialization($maxSize)
    {
        $file = new File(['maxSize' => 1000]);

        try {
            $file->maxSize = $maxSize;
        } catch (ConstraintDefinitionException $e) {
        }

        $this->assertSame(1000, $file->maxSize);
    }

    /**
     * @dataProvider provideInValidSizes
     * @expectedException \Symfony\Component\Validator\Exception\ConstraintDefinitionException
     */
    public function testInvalidMaxSize($maxSize)
    {
        new File(['maxSize' => $maxSize]);
    }

    public function provideValidSizes()
    {
        return [
            ['500', 500, false],
            [12300, 12300, false],
            ['1ki', 1024, true],
            ['1KI', 1024, true],
            ['2k', 2000, false],
            ['2K', 2000, false],
            ['1mi', 1048576, true],
            ['1MI', 1048576, true],
            ['3m', 3000000, false],
            ['3M', 3000000, false],
        ];
    }

    public function provideInvalidSizes()
    {
        return [
            ['+100'],
            ['foo'],
            ['1Ko'],
            ['1kio'],
            ['1G'],
            ['1Gi'],
        ];
    }

    /**
     * @dataProvider provideFormats
     */
    public function testBinaryFormat($maxSize, $guessedFormat, $binaryFormat)
    {
        $file = new File(['maxSize' => $maxSize, 'binaryFormat' => $guessedFormat]);

        $this->assertSame($binaryFormat, $file->binaryFormat);
    }

    public function provideFormats()
    {
        return [
            [100, null, false],
            [100, true, true],
            [100, false, false],
            ['100K', null, false],
            ['100K', true, true],
            ['100K', false, false],
            ['100Ki', null, true],
            ['100Ki', true, true],
            ['100Ki', false, false],
        ];
    }
}

<?php
use \ParagonIE\ConstantTime\Base32Hex;

class Base32HexTest extends PHPUnit\Framework\TestCase
{
    /**
     * @covers Base32Hex::encode()
     * @covers Base32Hex::decode()
     * @covers Base32Hex::encodeUpper()
     * @covers Base32Hex::decodeUpper()
     */
    public function testRandom()
    {
        for ($i = 1; $i < 32; ++$i) {
            for ($j = 0; $j < 50; ++$j) {
                $random = \random_bytes($i);

                $enc = Base32Hex::encode($random);
                $this->assertSame(
                    $random,
                    Base32Hex::decode($enc)
                );
                $unpadded = \rtrim($enc, '=');
                $this->assertSame(
                    $unpadded,
                    Base32Hex::encodeUnpadded($random)
                );
                $this->assertSame(
                    $random,
                    Base32Hex::decode($unpadded)
                );

                $enc = Base32Hex::encodeUpper($random);
                $this->assertSame(
                    $random,
                    Base32Hex::decodeUpper($enc)
                );                $unpadded = \rtrim($enc, '=');
                $this->assertSame(
                    $unpadded,
                    Base32Hex::encodeUpperUnpadded($random)
                );
                $this->assertSame(
                    $random,
                    Base32Hex::decodeUpper($unpadded)
                );
            }
        }
    }
}

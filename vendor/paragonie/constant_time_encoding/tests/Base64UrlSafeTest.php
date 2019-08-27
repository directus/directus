<?php

use ParagonIE\ConstantTime\Base64UrlSafe;
use ParagonIE\ConstantTime\Binary;

/**
 * Class Base64UrlSafeTest
 */
class Base64UrlSafeTest extends PHPUnit\Framework\TestCase
{
    /**
     * @covers Base64UrlSafe::encode()
     * @covers Base64UrlSafe::decode()
     *
     * @throws Exception
     * @throws TypeError
     */
    public function testRandom()
    {
        for ($i = 1; $i < 32; ++$i) {
            for ($j = 0; $j < 50; ++$j) {
                $random = \random_bytes($i);

                $enc = Base64UrlSafe::encode($random);
                $this->assertSame(
                    $random,
                    Base64UrlSafe::decode($enc)
                );
                $this->assertSame(
                    \strtr(\base64_encode($random), '+/', '-_'),
                    $enc
                );

                $unpadded = \rtrim($enc, '=');
                $this->assertSame(
                    $unpadded,
                    Base64UrlSafe::encodeUnpadded($random)
                );
                $this->assertSame(
                    $random,
                    Base64UrlSafe::decode($unpadded)
                );
            }
        }

        $random = \random_bytes(1 << 20);
        $enc = Base64UrlSafe::encode($random);
        $this->assertTrue(Binary::safeStrlen($enc) > 65536);
        $this->assertSame(
            $random,
            Base64UrlSafe::decode($enc)
        );
        $this->assertSame(
            \strtr(\base64_encode($random), '+/', '-_'),
            $enc
        );
    }
}

<?php
use \ParagonIE\ConstantTime\Base32;
use \ParagonIE\ConstantTime\Base32Hex;
use \ParagonIE\ConstantTime\Base64;
use \ParagonIE\ConstantTime\Base64DotSlash;
use \ParagonIE\ConstantTime\Base64DotSlashOrdered;
use \ParagonIE\ConstantTime\Encoding;
use \ParagonIE\ConstantTime\Hex;

/**
 * Class RFC4648Test
 *
 * @ref https://tools.ietf.org/html/rfc4648#section-10
 */
class RFC4648Test extends PHPUnit\Framework\TestCase
{
    public function testVectorBase64()
    {
        $this->assertSame(Base64::encode(''), '');
        $this->assertSame(Base64::encode('f'), 'Zg==');
        $this->assertSame(Base64::encode('fo'), 'Zm8=');
        $this->assertSame(Base64::encode('foo'), 'Zm9v');
        $this->assertSame(Base64::encode('foob'), 'Zm9vYg==');
        $this->assertSame(Base64::encode('fooba'), 'Zm9vYmE=');
        $this->assertSame(Base64::encode('foobar'), 'Zm9vYmFy');
    }

    public function testVectorBase32()
    {
        $this->assertSame(Base32::encode(''), '');
        $this->assertSame(Base32::encode('f'), 'my======');
        $this->assertSame(Base32::encode('fo'), 'mzxq====');
        $this->assertSame(Base32::encode('foo'), 'mzxw6===');
        $this->assertSame(Base32::encode('foob'), 'mzxw6yq=');
        $this->assertSame(Base32::encode('fooba'), 'mzxw6ytb');
        $this->assertSame(Base32::encode('foobar'), 'mzxw6ytboi======');

        $this->assertSame(Base32::encodeUpper(''), '');
        $this->assertSame(Base32::encodeUpper('f'), 'MY======');
        $this->assertSame(Base32::encodeUpper('fo'), 'MZXQ====');
        $this->assertSame(Base32::encodeUpper('foo'), 'MZXW6===');
        $this->assertSame(Base32::encodeUpper('foob'), 'MZXW6YQ=');
        $this->assertSame(Base32::encodeUpper('fooba'), 'MZXW6YTB');
        $this->assertSame(Base32::encodeUpper('foobar'), 'MZXW6YTBOI======');
    }

    public function testVectorBase32Hex()
    {
        $this->assertSame(Base32Hex::encode(''), '');
        $this->assertSame(Base32Hex::encode('f'), 'co======');
        $this->assertSame(Base32Hex::encode('fo'), 'cpng====');
        $this->assertSame(Base32Hex::encode('foo'), 'cpnmu===');
        $this->assertSame(Base32Hex::encode('foob'), 'cpnmuog=');
        $this->assertSame(Base32Hex::encode('fooba'), 'cpnmuoj1');
        $this->assertSame(Base32Hex::encode('foobar'), 'cpnmuoj1e8======');

        $this->assertSame(Base32Hex::encodeUpper(''), '');
        $this->assertSame(Base32Hex::encodeUpper('f'), 'CO======');
        $this->assertSame(Base32Hex::encodeUpper('fo'), 'CPNG====');
        $this->assertSame(Base32Hex::encodeUpper('foo'), 'CPNMU===');
        $this->assertSame(Base32Hex::encodeUpper('foob'), 'CPNMUOG=');
        $this->assertSame(Base32Hex::encodeUpper('fooba'), 'CPNMUOJ1');
        $this->assertSame(Base32Hex::encodeUpper('foobar'), 'CPNMUOJ1E8======');
    }

    public function testVectorBase16()
    {
        $this->assertSame(Hex::encode(''), '');
        $this->assertSame(Hex::encode('f'), '66');
        $this->assertSame(Hex::encode('fo'), '666f');
        $this->assertSame(Hex::encode('foo'), '666f6f');
        $this->assertSame(Hex::encode('foob'), '666f6f62');
        $this->assertSame(Hex::encode('fooba'), '666f6f6261');
        $this->assertSame(Hex::encode('foobar'), '666f6f626172');

        $this->assertSame(Hex::encodeUpper(''), '');
        $this->assertSame(Hex::encodeUpper('f'), '66');
        $this->assertSame(Hex::encodeUpper('fo'), '666F');
        $this->assertSame(Hex::encodeUpper('foo'), '666F6F');
        $this->assertSame(Hex::encodeUpper('foob'), '666F6F62');
        $this->assertSame(Hex::encodeUpper('fooba'), '666F6F6261');
        $this->assertSame(Hex::encodeUpper('foobar'), '666F6F626172');
    }
}

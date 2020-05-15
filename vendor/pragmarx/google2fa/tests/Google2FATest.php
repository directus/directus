<?php

namespace PragmaRX\Google2FA\Tests;

use PHPUnit\Framework\TestCase;
use PragmaRX\Google2FA\Google2FA;
use PragmaRX\Google2FA\Support\Constants as Google2FAConstants;

class Google2FATest extends TestCase
{
    public function setUp()
    {
        $this->google2fa = new Google2FA();
    }

    public function testIsInitializable()
    {
        $this->assertInstanceOf(
            'PragmaRX\Google2FA\Google2FA',
            $this->google2fa
        );
    }

    public function testGeneratesAValidSecretKey()
    {
        $this->assertEquals(16, strlen($this->google2fa->generateSecretKey()));

        $this->assertEquals(
            32,
            strlen($this->google2fa->generateSecretKey(32))
        );

        $this->assertStringStartsWith(
            'MFXHI',
            $this->google2fa->generateSecretKey(59, 'ant')
        );

        $this->assertStringStartsWith(
            'MFXHI',
            $this->google2fa->generateSecretKey(59, 'ant')
        );

        $this->assertEquals(
            $key = $this->google2fa->generateSecretKey(),
            preg_replace(
                '/[^' . Google2FAConstants::VALID_FOR_B32 . ']/',
                '',
                $key
            )
        );
    }

    /**
     * @expectedException  \PragmaRX\Google2FA\Exceptions\IncompatibleWithGoogleAuthenticatorException
     */
    public function testGeneratesASecretKeysCompatibleWithGoogleAuthenticatorOrNot()
    {
        $this->google2fa
            ->setEnforceGoogleAuthenticatorCompatibility(true)
            ->generateSecretKey(17);

        $this->assertEquals(
            17,
            strlen(
                $this->google2fa
                    ->setEnforceGoogleAuthenticatorCompatibility(false)
                    ->generateSecretKey(17)
            )
        );
    }

    public function testConvertsInvalidCharsToBase32()
    {
        $converted = $this->google2fa->generateBase32RandomKey(
            16,
            '1234' .
                chr(250) .
                chr(251) .
                chr(252) .
                chr(253) .
                chr(254) .
                chr(255)
        );

        $valid = preg_replace(
            '/[^' . Google2FAConstants::VALID_FOR_B32 . ']/',
            '',
            $converted
        );

        $this->assertEquals($converted, $valid);
    }

    public function testGetsValidTimestamps()
    {
        $ts = $this->google2fa->getTimestamp();

        $this->assertLessThanOrEqual(PHP_INT_MAX, $ts);

        $this->assertGreaterThanOrEqual(~PHP_INT_MAX, $ts);
    }

    public function testDecodesBase32Strings()
    {
        $result =
            chr(0) .
            chr(232) .
            chr(196) .
            chr(187) .
            chr(190) .
            chr(223) .
            chr(26) .
            chr(241) .
            chr(145) .
            chr(86);

        $this->assertEquals(
            $result,
            $this->google2fa->base32Decode(Constants::SECRET)
        );
    }

    public function testCreatesAOneTimePassword()
    {
        $this->assertEquals(
            6,
            strlen($this->google2fa->getCurrentOtp(Constants::SECRET))
        );
    }

    public function testVerifiesKeys()
    {
        // $ts 26213400 with KEY_REGENERATION 30 seconds is
        // timestamp 786402000, which is 1994-12-02 21:00:00 UTC

        $this->assertTrue(
            $this->google2fa->verifyKey(
                Constants::SECRET,
                '558854',
                2,
                26213400
            )
        ); // 26213398
        $this->assertTrue(
            $this->google2fa->verifyKey(
                Constants::SECRET,
                '981084',
                2,
                26213400
            )
        ); // 26213399
        $this->assertTrue(
            $this->google2fa->verifyKey(
                Constants::SECRET,
                '512396',
                2,
                26213400
            )
        ); // 26213400
        $this->assertTrue(
            $this->google2fa->verifyKey(
                Constants::SECRET,
                '410272',
                2,
                26213400
            )
        ); // 26213401
        $this->assertTrue(
            $this->google2fa->verifyKey(
                Constants::SECRET,
                '239815',
                2,
                26213400
            )
        ); // 26213402

        $this->assertFalse(
            $this->google2fa->verifyKey(
                Constants::SECRET,
                '313366',
                2,
                26213400
            )
        ); // 26213403
        $this->assertFalse(
            $this->google2fa->verifyKey(
                Constants::SECRET,
                '093183',
                2,
                26213400
            )
        ); // 26213397
    }

    public function testVerifiesKeysNewer()
    {
        $this->assertFalse(
            $this->google2fa->verifyKeyNewer(
                Constants::SECRET,
                '512396',
                26213401,
                2,
                26213400
            )
        );
        $this->assertFalse(
            $this->google2fa->verifyKeyNewer(
                Constants::SECRET,
                '410272',
                26213401,
                2,
                26213400
            )
        );
        $this->assertEquals(
            26213402,
            $this->google2fa->verifyKeyNewer(
                Constants::SECRET,
                '239815',
                26213401,
                2,
                26213400
            )
        );
        $this->assertFalse(
            $this->google2fa->verifyKeyNewer(
                Constants::SECRET,
                '313366',
                26213401,
                2,
                26213400
            )
        );

        $this->assertEquals(
            26213400,
            $this->google2fa->verifyKeyNewer(
                Constants::SECRET,
                '512396',
                null,
                2,
                26213400
            )
        );
        $this->assertEquals(
            26213401,
            $this->google2fa->verifyKeyNewer(
                Constants::SECRET,
                '410272',
                null,
                2,
                26213400
            )
        );
        $this->assertEquals(
            26213402,
            $this->google2fa->verifyKeyNewer(
                Constants::SECRET,
                '239815',
                null,
                2,
                26213400
            )
        );
        $this->assertFalse(
            $this->google2fa->verifyKeyNewer(
                Constants::SECRET,
                '313366',
                null,
                2,
                26213400
            )
        );
    }

    public function testRemovesInvalidCharsFromSecret()
    {
        $this->assertEquals(
            Constants::SECRET,
            $this->google2fa->removeInvalidChars(Constants::SECRET . '!1-@@@')
        );
    }

    public function testConvertsToBase32()
    {
        $this->assertEquals(
            'KBZGCZ3NMFJFQ',
            $this->google2fa->toBase32('PragmaRX')
        );
    }

    public function testSetsTheWindow()
    {
        $this->google2fa->setWindow(6);

        $this->assertEquals(6, $this->google2fa->getWindow());

        $this->assertEquals(1, $this->google2fa->getWindow(1));

        $this->google2fa->setWindow(0);

        $this->assertFalse(
            $this->google2fa->verifyKey(
                Constants::SECRET,
                '558854',
                null,
                26213400
            )
        );

        $this->google2fa->setWindow(2);

        $this->assertTrue(
            $this->google2fa->verifyKey(
                Constants::SECRET,
                '558854',
                null,
                26213400
            )
        );
        $this->assertTrue(
            $this->google2fa->verifyKey(
                Constants::SECRET,
                '558854',
                null,
                26213399
            )
        );
        $this->assertTrue(
            $this->google2fa->verifyKey(
                Constants::SECRET,
                '558854',
                null,
                26213398
            )
        );
        $this->assertTrue(
            $this->google2fa->verifyKey(
                Constants::SECRET,
                '558854',
                null,
                26213396
            )
        );
        $this->assertFalse(
            $this->google2fa->verifyKey(
                Constants::SECRET,
                '558854',
                null,
                26213395
            )
        );
    }

    public function testSetsTheSecret()
    {
        $this->assertFalse(
            $this->google2fa->verify('558854', Constants::WRONG_SECRET)
        );

        $this->google2fa->setWindow(2);

        $this->assertTrue(
            $this->google2fa->verify(
                '558854',
                Constants::SECRET,
                null,
                26213400
            )
        );

        $this->google2fa->setSecret(Constants::SECRET);

        $this->assertTrue(
            $this->google2fa->verify('558854', null, null, 26213400)
        );
    }

    public function testGetsKeyRegeneration()
    {
        $this->google2fa->setKeyRegeneration(11);

        $this->assertEquals(11, $this->google2fa->getKeyRegeneration());
    }

    public function testGetsOtpLength()
    {
        $this->google2fa->setOneTimePasswordLength(7);

        $this->assertEquals(7, $this->google2fa->getOneTimePasswordLength());
    }

    public function testGeneratesPasswordsInManyDifferentSizes()
    {
        $this->google2fa->setWindow(2);

        $this->google2fa->setOneTimePasswordLength(6);

        $this->assertTrue(
            $this->google2fa->verifyKey(
                Constants::SECRET,
                '558854',
                null,
                26213400
            )
        );

        $this->google2fa->setOneTimePasswordLength(7);

        $this->assertTrue(
            $this->google2fa->verifyKey(
                Constants::SECRET,
                '8981084',
                null,
                26213400
            )
        );
    }

    /**
     * @expectedException  \PragmaRX\Google2FA\Exceptions\SecretKeyTooShortException
     */
    public function testShortSecretKey()
    {
        $this->google2fa->setEnforceGoogleAuthenticatorCompatibility(false);

        $this->google2fa->verifyKey(
            Constants::SHORT_SECRET,
            '558854',
            null,
            26213400
        );
    }

    /**
     * @expectedException  \PragmaRX\Google2FA\Exceptions\InvalidCharactersException
     */
    public function testValidateKey()
    {
        $this->assertTrue(
            is_numeric($this->google2fa->getCurrentOtp(Constants::SECRET))
        );

        $this->google2fa->setEnforceGoogleAuthenticatorCompatibility(false);

        $this->google2fa->getCurrentOtp(Constants::INVALID_SECRET);
    }
}

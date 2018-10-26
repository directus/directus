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

use Symfony\Component\Validator\Constraints\Ip;
use Symfony\Component\Validator\Constraints\IpValidator;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

class IpValidatorTest extends ConstraintValidatorTestCase
{
    protected function createValidator()
    {
        return new IpValidator();
    }

    public function testNullIsValid()
    {
        $this->validator->validate(null, new Ip());

        $this->assertNoViolation();
    }

    public function testEmptyStringIsValid()
    {
        $this->validator->validate('', new Ip());

        $this->assertNoViolation();
    }

    /**
     * @expectedException \Symfony\Component\Validator\Exception\UnexpectedTypeException
     */
    public function testExpectsStringCompatibleType()
    {
        $this->validator->validate(new \stdClass(), new Ip());
    }

    /**
     * @expectedException \Symfony\Component\Validator\Exception\ConstraintDefinitionException
     */
    public function testInvalidValidatorVersion()
    {
        new Ip(array(
            'version' => 666,
        ));
    }

    /**
     * @dataProvider getValidIpsV4
     */
    public function testValidIpsV4($ip)
    {
        $this->validator->validate($ip, new Ip(array(
            'version' => Ip::V4,
        )));

        $this->assertNoViolation();
    }

    public function getValidIpsV4()
    {
        return array(
            array('0.0.0.0'),
            array('10.0.0.0'),
            array('123.45.67.178'),
            array('172.16.0.0'),
            array('192.168.1.0'),
            array('224.0.0.1'),
            array('255.255.255.255'),
            array('127.0.0.0'),
        );
    }

    /**
     * @dataProvider getValidIpsV6
     */
    public function testValidIpsV6($ip)
    {
        $this->validator->validate($ip, new Ip(array(
            'version' => Ip::V6,
        )));

        $this->assertNoViolation();
    }

    public function getValidIpsV6()
    {
        return array(
            array('2001:0db8:85a3:0000:0000:8a2e:0370:7334'),
            array('2001:0DB8:85A3:0000:0000:8A2E:0370:7334'),
            array('2001:0Db8:85a3:0000:0000:8A2e:0370:7334'),
            array('fdfe:dcba:9876:ffff:fdc6:c46b:bb8f:7d4c'),
            array('fdc6:c46b:bb8f:7d4c:fdc6:c46b:bb8f:7d4c'),
            array('fdc6:c46b:bb8f:7d4c:0000:8a2e:0370:7334'),
            array('fe80:0000:0000:0000:0202:b3ff:fe1e:8329'),
            array('fe80:0:0:0:202:b3ff:fe1e:8329'),
            array('fe80::202:b3ff:fe1e:8329'),
            array('0:0:0:0:0:0:0:0'),
            array('::'),
            array('0::'),
            array('::0'),
            array('0::0'),
            // IPv4 mapped to IPv6
            array('2001:0db8:85a3:0000:0000:8a2e:0.0.0.0'),
            array('::0.0.0.0'),
            array('::255.255.255.255'),
            array('::123.45.67.178'),
        );
    }

    /**
     * @dataProvider getValidIpsAll
     */
    public function testValidIpsAll($ip)
    {
        $this->validator->validate($ip, new Ip(array(
            'version' => Ip::ALL,
        )));

        $this->assertNoViolation();
    }

    public function getValidIpsAll()
    {
        return array_merge($this->getValidIpsV4(), $this->getValidIpsV6());
    }

    /**
     * @dataProvider getInvalidIpsV4
     */
    public function testInvalidIpsV4($ip)
    {
        $constraint = new Ip(array(
            'version' => Ip::V4,
            'message' => 'myMessage',
        ));

        $this->validator->validate($ip, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$ip.'"')
            ->setCode(Ip::INVALID_IP_ERROR)
            ->assertRaised();
    }

    public function getInvalidIpsV4()
    {
        return array(
            array('0'),
            array('0.0'),
            array('0.0.0'),
            array('256.0.0.0'),
            array('0.256.0.0'),
            array('0.0.256.0'),
            array('0.0.0.256'),
            array('-1.0.0.0'),
            array('foobar'),
        );
    }

    /**
     * @dataProvider getInvalidPrivateIpsV4
     */
    public function testInvalidPrivateIpsV4($ip)
    {
        $constraint = new Ip(array(
            'version' => Ip::V4_NO_PRIV,
            'message' => 'myMessage',
        ));

        $this->validator->validate($ip, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$ip.'"')
            ->setCode(Ip::INVALID_IP_ERROR)
            ->assertRaised();
    }

    public function getInvalidPrivateIpsV4()
    {
        return array(
            array('10.0.0.0'),
            array('172.16.0.0'),
            array('192.168.1.0'),
        );
    }

    /**
     * @dataProvider getInvalidReservedIpsV4
     */
    public function testInvalidReservedIpsV4($ip)
    {
        $constraint = new Ip(array(
            'version' => Ip::V4_NO_RES,
            'message' => 'myMessage',
        ));

        $this->validator->validate($ip, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$ip.'"')
            ->setCode(Ip::INVALID_IP_ERROR)
            ->assertRaised();
    }

    public function getInvalidReservedIpsV4()
    {
        return array(
            array('0.0.0.0'),
            array('240.0.0.1'),
            array('255.255.255.255'),
        );
    }

    /**
     * @dataProvider getInvalidPublicIpsV4
     */
    public function testInvalidPublicIpsV4($ip)
    {
        $constraint = new Ip(array(
            'version' => Ip::V4_ONLY_PUBLIC,
            'message' => 'myMessage',
        ));

        $this->validator->validate($ip, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$ip.'"')
            ->setCode(Ip::INVALID_IP_ERROR)
            ->assertRaised();
    }

    public function getInvalidPublicIpsV4()
    {
        return array_merge($this->getInvalidPrivateIpsV4(), $this->getInvalidReservedIpsV4());
    }

    /**
     * @dataProvider getInvalidIpsV6
     */
    public function testInvalidIpsV6($ip)
    {
        $constraint = new Ip(array(
            'version' => Ip::V6,
            'message' => 'myMessage',
        ));

        $this->validator->validate($ip, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$ip.'"')
            ->setCode(Ip::INVALID_IP_ERROR)
            ->assertRaised();
    }

    public function getInvalidIpsV6()
    {
        return array(
            array('z001:0db8:85a3:0000:0000:8a2e:0370:7334'),
            array('fe80'),
            array('fe80:8329'),
            array('fe80:::202:b3ff:fe1e:8329'),
            array('fe80::202:b3ff::fe1e:8329'),
            // IPv4 mapped to IPv6
            array('2001:0db8:85a3:0000:0000:8a2e:0370:0.0.0.0'),
            array('::0.0'),
            array('::0.0.0'),
            array('::256.0.0.0'),
            array('::0.256.0.0'),
            array('::0.0.256.0'),
            array('::0.0.0.256'),
        );
    }

    /**
     * @dataProvider getInvalidPrivateIpsV6
     */
    public function testInvalidPrivateIpsV6($ip)
    {
        $constraint = new Ip(array(
            'version' => Ip::V6_NO_PRIV,
            'message' => 'myMessage',
        ));

        $this->validator->validate($ip, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$ip.'"')
            ->setCode(Ip::INVALID_IP_ERROR)
            ->assertRaised();
    }

    public function getInvalidPrivateIpsV6()
    {
        return array(
            array('fdfe:dcba:9876:ffff:fdc6:c46b:bb8f:7d4c'),
            array('fdc6:c46b:bb8f:7d4c:fdc6:c46b:bb8f:7d4c'),
            array('fdc6:c46b:bb8f:7d4c:0000:8a2e:0370:7334'),
        );
    }

    /**
     * @dataProvider getInvalidReservedIpsV6
     */
    public function testInvalidReservedIpsV6($ip)
    {
        $constraint = new Ip(array(
            'version' => Ip::V6_NO_RES,
            'message' => 'myMessage',
        ));

        $this->validator->validate($ip, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$ip.'"')
            ->setCode(Ip::INVALID_IP_ERROR)
            ->assertRaised();
    }

    public function getInvalidReservedIpsV6()
    {
        // Quoting after official filter documentation:
        // "FILTER_FLAG_NO_RES_RANGE = This flag does not apply to IPv6 addresses."
        // Full description: http://php.net/manual/en/filter.filters.flags.php
        return $this->getInvalidIpsV6();
    }

    /**
     * @dataProvider getInvalidPublicIpsV6
     */
    public function testInvalidPublicIpsV6($ip)
    {
        $constraint = new Ip(array(
            'version' => Ip::V6_ONLY_PUBLIC,
            'message' => 'myMessage',
        ));

        $this->validator->validate($ip, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$ip.'"')
            ->setCode(Ip::INVALID_IP_ERROR)
            ->assertRaised();
    }

    public function getInvalidPublicIpsV6()
    {
        return array_merge($this->getInvalidPrivateIpsV6(), $this->getInvalidReservedIpsV6());
    }

    /**
     * @dataProvider getInvalidIpsAll
     */
    public function testInvalidIpsAll($ip)
    {
        $constraint = new Ip(array(
            'version' => Ip::ALL,
            'message' => 'myMessage',
        ));

        $this->validator->validate($ip, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$ip.'"')
            ->setCode(Ip::INVALID_IP_ERROR)
            ->assertRaised();
    }

    public function getInvalidIpsAll()
    {
        return array_merge($this->getInvalidIpsV4(), $this->getInvalidIpsV6());
    }

    /**
     * @dataProvider getInvalidPrivateIpsAll
     */
    public function testInvalidPrivateIpsAll($ip)
    {
        $constraint = new Ip(array(
            'version' => Ip::ALL_NO_PRIV,
            'message' => 'myMessage',
        ));

        $this->validator->validate($ip, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$ip.'"')
            ->setCode(Ip::INVALID_IP_ERROR)
            ->assertRaised();
    }

    public function getInvalidPrivateIpsAll()
    {
        return array_merge($this->getInvalidPrivateIpsV4(), $this->getInvalidPrivateIpsV6());
    }

    /**
     * @dataProvider getInvalidReservedIpsAll
     */
    public function testInvalidReservedIpsAll($ip)
    {
        $constraint = new Ip(array(
            'version' => Ip::ALL_NO_RES,
            'message' => 'myMessage',
        ));

        $this->validator->validate($ip, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$ip.'"')
            ->setCode(Ip::INVALID_IP_ERROR)
            ->assertRaised();
    }

    public function getInvalidReservedIpsAll()
    {
        return array_merge($this->getInvalidReservedIpsV4(), $this->getInvalidReservedIpsV6());
    }

    /**
     * @dataProvider getInvalidPublicIpsAll
     */
    public function testInvalidPublicIpsAll($ip)
    {
        $constraint = new Ip(array(
            'version' => Ip::ALL_ONLY_PUBLIC,
            'message' => 'myMessage',
        ));

        $this->validator->validate($ip, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$ip.'"')
            ->setCode(Ip::INVALID_IP_ERROR)
            ->assertRaised();
    }

    public function getInvalidPublicIpsAll()
    {
        return array_merge($this->getInvalidPublicIpsV4(), $this->getInvalidPublicIpsV6());
    }
}

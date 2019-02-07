<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Constraints;

use Symfony\Component\Validator\Constraint;

/**
 * @Annotation
 * @Target({"PROPERTY", "METHOD", "ANNOTATION"})
 *
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class Url extends Constraint
{
    const CHECK_DNS_TYPE_ANY = 'ANY';
    const CHECK_DNS_TYPE_NONE = false;
    const CHECK_DNS_TYPE_A = 'A';
    const CHECK_DNS_TYPE_A6 = 'A6';
    const CHECK_DNS_TYPE_AAAA = 'AAAA';
    const CHECK_DNS_TYPE_CNAME = 'CNAME';
    const CHECK_DNS_TYPE_MX = 'MX';
    const CHECK_DNS_TYPE_NAPTR = 'NAPTR';
    const CHECK_DNS_TYPE_NS = 'NS';
    const CHECK_DNS_TYPE_PTR = 'PTR';
    const CHECK_DNS_TYPE_SOA = 'SOA';
    const CHECK_DNS_TYPE_SRV = 'SRV';
    const CHECK_DNS_TYPE_TXT = 'TXT';

    const INVALID_URL_ERROR = '57c2f299-1154-4870-89bb-ef3b1f5ad229';

    protected static $errorNames = [
        self::INVALID_URL_ERROR => 'INVALID_URL_ERROR',
    ];

    public $message = 'This value is not a valid URL.';
    public $dnsMessage = 'The host could not be resolved.';
    public $protocols = ['http', 'https'];
    public $checkDNS = self::CHECK_DNS_TYPE_NONE;
}

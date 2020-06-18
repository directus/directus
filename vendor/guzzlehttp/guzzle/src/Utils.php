<?php
namespace GuzzleHttp;

use GuzzleHttp\Exception\InvalidArgumentException;
use Psr\Http\Message\UriInterface;
use Symfony\Polyfill\Intl\Idn\Idn;

final class Utils
{
    /**
     * Wrapper for the hrtime() or microtime() functions
     * (depending on the PHP version, one of the two is used)
     *
     * @return float|mixed UNIX timestamp
     *
     * @internal
     */
    public static function currentTime()
    {
        return function_exists('hrtime') ? hrtime(true) / 1e9 : microtime(true);
    }

    /**
     * @param int $options
     *
     * @return UriInterface
     * @throws InvalidArgumentException
     *
     * @internal
     */
    public static function idnUriConvert(UriInterface $uri, $options = 0)
    {
        if ($uri->getHost()) {
            $asciiHost = self::idnToAsci($uri->getHost(), $options, $info);
            if ($asciiHost === false) {
                $errorBitSet = isset($info['errors']) ? $info['errors'] : 0;

                $errorConstants = array_filter(array_keys(get_defined_constants()), function ($name) {
                    return substr($name, 0, 11) === 'IDNA_ERROR_';
                });

                $errors = [];
                foreach ($errorConstants as $errorConstant) {
                    if ($errorBitSet & constant($errorConstant)) {
                        $errors[] = $errorConstant;
                    }
                }

                $errorMessage = 'IDN conversion failed';
                if ($errors) {
                    $errorMessage .= ' (errors: ' . implode(', ', $errors) . ')';
                }

                throw new InvalidArgumentException($errorMessage);
            } else {
                if ($uri->getHost() !== $asciiHost) {
                    // Replace URI only if the ASCII version is different
                    $uri = $uri->withHost($asciiHost);
                }
            }
        }

        return $uri;
    }

    /**
     * @param string $domain
     * @param int    $options
     * @param array  $info
     *
     * @return string|false
     */
    private static function idnToAsci($domain, $options, &$info = [])
    {
        if (\preg_match('%^[ -~]+$%', $domain) === 1) {
            return $domain;
        }

        if (\extension_loaded('intl') && defined('INTL_IDNA_VARIANT_UTS46')) {
            return \idn_to_ascii($domain, $options, INTL_IDNA_VARIANT_UTS46, $info);
        }

        /*
         * The Idn class is marked as @internal. Verify that class and method exists.
         */
        if (method_exists(Idn::class, 'idn_to_ascii')) {
            return Idn::idn_to_ascii($domain, $options, Idn::INTL_IDNA_VARIANT_UTS46, $info);
        }

        throw new \RuntimeException('ext-intl or symfony/polyfill-intl-idn not loaded or too old');
    }
}

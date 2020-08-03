<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Symfony\Polyfill\Intl\Normalizer as p;

if (!function_exists('normalizer_is_normalized')) {
    function normalizer_is_normalized($s, $form = p\Normalizer::NFC) { return p\Normalizer::isNormalized($s, $form); }
}
if (!function_exists('normalizer_normalize')) {
    function normalizer_normalize($s, $form = p\Normalizer::NFC) { return p\Normalizer::normalize($s, $form); }
}

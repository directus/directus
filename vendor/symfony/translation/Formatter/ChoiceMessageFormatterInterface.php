<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Translation\Formatter;

/**
 * @author Abdellatif Ait boudad <a.aitboudad@gmail.com>
 */
interface ChoiceMessageFormatterInterface
{
    /**
     * Formats a localized message pattern with given arguments.
     *
     * @param string $message    The message (may also be an object that can be cast to string)
     * @param int    $number     The number to use to find the indice of the message
     * @param string $locale     The message locale
     * @param array  $parameters An array of parameters for the message
     *
     * @return string
     */
    public function choiceFormat($message, $number, $locale, array $parameters = array());
}

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

use Symfony\Component\Translation\IdentityTranslator;
use Symfony\Component\Translation\MessageSelector;
use Symfony\Component\Translation\TranslatorInterface as LegacyTranslatorInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * @author Abdellatif Ait boudad <a.aitboudad@gmail.com>
 */
class MessageFormatter implements MessageFormatterInterface, IntlFormatterInterface, ChoiceMessageFormatterInterface
{
    private $translator;
    private $intlFormatter;

    /**
     * @param TranslatorInterface|null $translator An identity translator to use as selector for pluralization
     */
    public function __construct($translator = null, IntlFormatterInterface $intlFormatter = null)
    {
        if ($translator instanceof MessageSelector) {
            $translator = new IdentityTranslator($translator);
        } elseif (null !== $translator && !$translator instanceof TranslatorInterface && !$translator instanceof LegacyTranslatorInterface) {
            throw new \TypeError(sprintf('Argument 1 passed to %s() must be an instance of %s, %s given.', __METHOD__, TranslatorInterface::class, \is_object($translator) ? \get_class($translator) : \gettype($translator)));
        }

        $this->translator = $translator ?? new IdentityTranslator();
        $this->intlFormatter = $intlFormatter ?? new IntlFormatter();
    }

    /**
     * {@inheritdoc}
     */
    public function format($message, $locale, array $parameters = array())
    {
        if ($this->translator instanceof TranslatorInterface) {
            return $this->translator->trans($message, $parameters, null, $locale);
        }

        return strtr($message, $parameters);
    }

    /**
     * {@inheritdoc}
     */
    public function formatIntl(string $message, string $locale, array $parameters = array()): string
    {
        return $this->intlFormatter->formatIntl($message, $locale, $parameters);
    }

    /**
     * {@inheritdoc}
     *
     * @deprecated since Symfony 4.2, use format() with a %count% parameter instead
     */
    public function choiceFormat($message, $number, $locale, array $parameters = array())
    {
        @trigger_error(sprintf('The "%s()" method is deprecated since Symfony 4.2, use the format() one instead with a %count% parameter.', __METHOD__), E_USER_DEPRECATED);

        $parameters = array('%count%' => $number) + $parameters;

        if ($this->translator instanceof TranslatorInterface) {
            return $this->format($message, $locale, $parameters);
        }

        return $this->format($this->translator->transChoice($message, $number, array(), null, $locale), $locale, $parameters);
    }
}

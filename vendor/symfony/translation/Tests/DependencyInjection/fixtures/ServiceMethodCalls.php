<?php

namespace Symfony\Component\Translation\Tests\DependencyInjection\fixtures;

use Symfony\Contracts\Translation\TranslatorInterface;

class ServiceMethodCalls
{
    public function setTranslator(TranslatorInterface $translator)
    {
    }
}

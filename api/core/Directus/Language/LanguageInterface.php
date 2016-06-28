<?php

namespace Directus\Language;

interface LanguageInterface
{
    /**
     * Get the language code
     * @return string
     */
    public function getCode();

    /**
     * Get the language name
     * @return string
     */
    public function getName();
}

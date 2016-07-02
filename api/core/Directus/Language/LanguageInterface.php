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

    /**
     * Get an array representation of the language
     * @return array
     */
    public function toArray();
}

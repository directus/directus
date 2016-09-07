<?php

namespace Directus\Language;

class Language implements LanguageInterface
{
    /**
     * Language code
     * @var string
     */
    protected $code = 'en';

    /**
     * Language name
     * @var string
     */
    protected $name = 'English';

    public function __construct(array $attributes = [])
    {
        foreach ($attributes as $key => $value) {
            if (property_exists($this, $key)) {
                $this->{$key} = $value;
            }
        }
    }

    public function getCode()
    {
        return $this->code;
    }

    public function getName()
    {
        return $this->name;
    }

    public function toArray()
    {
        return [
            'code' => $this->code,
            'name' => $this->name
        ];
    }
}

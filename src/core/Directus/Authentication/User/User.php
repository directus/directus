<?php

namespace Directus\Authentication\User;

use Directus\Authentication\Exception\UnknownUserAttributeException;
use Directus\Util\ArrayUtils;

class User implements UserInterface
{
    /**
     * User attributes
     *
     * @var array
     */
    protected $attributes;

    public function __construct(array $attributes = [])
    {
        $this->attributes = $attributes;
    }

    /**
     * Gets the attribute with the given name
     *
     * @param $name
     *
     * @return mixed
     */
    public function get($name)
    {
        return ArrayUtils::get($this->attributes, $name);
    }

    /**
     * @inheritdoc
     */
    public function getId()
    {
        return $this->get('id');
    }

    /**
     * @inheritdoc
     */
    public function getEmail()
    {
        return $this->get('email');
    }

    /**
     * @inheritdoc
     */
    public function get2FASecret()
    {
        return $this->get('2fa_secret');
    }

    /**
     * @inheritdoc
     */
    public function getGroupId()
    {
        return $this->get('group');
    }

    /**
     * Access the attribute as property
     *
     * @param $name
     *
     * @return mixed
     *
     * @throws UnknownUserAttributeException
     */
    public function __get($name)
    {
        if (!array_key_exists($name, $this->attributes)) {
            throw new UnknownUserAttributeException(sprintf('Property "%s" does not exist.', $name));
        }

        // TODO: Omit sensitive data
        return $this->attributes[$name];
    }

    /**
     * @inheritdoc
     */
    public function toArray()
    {
        return $this->attributes;
    }
}

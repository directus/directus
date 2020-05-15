<?php

namespace Directus\Authentication\User;

interface UserInterface
{
    /**
     * Gets an attribute information
     *
     * @param $attribute
     *
     * @return mixed
     */
    public function get($attribute);

    /**
     * Gets the user identification number
     *
     * @return int
     */
    public function getId();

    /**
     * Gets the user email
     *
     * @return string
     */
    public function getEmail();

    /**
     * Gets the user 2FA code
     *
     * @return string
     */
    public function get2FASecret();

    /**
     * Gets the user group id
     *
     * @return int
     */
    public function getGroupId();

    /**
     * Array representation of the object
     *
     * @return array
     */
    public function toArray();
}


<?php

namespace League\OAuth2\Client\Provider;

class FacebookUser implements ResourceOwnerInterface
{
    /**
     * @var array
     */
    protected $data;

    /**
     * @param  array $response
     */
    public function __construct(array $response)
    {
        $this->data = $response;

        if (!empty($response['picture']['data']['url'])) {
            $this->data['picture_url'] = $response['picture']['data']['url'];
        }

        if (isset($response['picture']['data']['is_silhouette'])) {
            $this->data['is_silhouette'] = $response['picture']['data']['is_silhouette'];
        }

        if (!empty($response['cover']['source'])) {
            $this->data['cover_photo_url'] = $response['cover']['source'];
        }
    }

    /**
     * Returns the ID for the user as a string if present.
     *
     * @return string|null
     */
    public function getId()
    {
        return $this->getField('id');
    }

    /**
     * Returns the name for the user as a string if present.
     *
     * @return string|null
     */
    public function getName()
    {
        return $this->getField('name');
    }

    /**
     * Returns the first name for the user as a string if present.
     *
     * @return string|null
     */
    public function getFirstName()
    {
        return $this->getField('first_name');
    }

    /**
     * Returns the last name for the user as a string if present.
     *
     * @return string|null
     */
    public function getLastName()
    {
        return $this->getField('last_name');
    }

    /**
     * Returns the email for the user as a string if present.
     *
     * @return string|null
     */
    public function getEmail()
    {
        return $this->getField('email');
    }

    /**
     * Returns the current location of the user as an array.
     *
     * @return array|null
     */
    public function getHometown()
    {
        return $this->getField('hometown');
    }

    /**
     * Returns the "about me" bio for the user as a string if present.
     *
     * @return string|null
     * @deprecated The bio field was removed in Graph v2.8
     */
    public function getBio()
    {
        return $this->getField('bio');
    }

    /**
     * Returns if user has not defined a specific avatar
     *
     * @return boolean
     */

    public function isDefaultPicture()
    {
        return $this->getField('is_silhouette');
    }

    /**
     * Returns the profile picture of the user as a string if present.
     *
     * @return string|null
     */
    public function getPictureUrl()
    {
        return $this->getField('picture_url');
    }

    /**
     * Returns the cover photo URL of the user as a string if present.
     *
     * @return string|null
     * @deprecated
     */
    public function getCoverPhotoUrl()
    {
        return $this->getField('cover_photo_url');
    }

    /**
     * Returns the gender for the user as a string if present.
     *
     * @return string|null
     */
    public function getGender()
    {
        return $this->getField('gender');
    }

    /**
     * Returns the locale of the user as a string if available.
     *
     * @return string|null
     * @deprecated
     */
    public function getLocale()
    {
        return $this->getField('locale');
    }

    /**
     * Returns the Facebook URL for the user as a string if available.
     *
     * @return string|null
     */
    public function getLink()
    {
        return $this->getField('link');
    }

    /**
     * Returns the current timezone offset from UTC (from -24 to 24)
     *
     * @return float|null
     * @deprecated
     */
    public function getTimezone()
    {
        return $this->getField('timezone');
    }

    /**
     * Returns the lower bound of the user's age range
     *
     * @return integer|null
     */
    public function getMinAge()
    {
        if (isset($this->data['age_range']['min'])) {
            return $this->data['age_range']['min'];
        }
        return null;
    }

    /**
     * Returns the upper bound of the user's age range
     *
     * @return integer|null
     */
    public function getMaxAge()
    {
        if (isset($this->data['age_range']['max'])) {
            return $this->data['age_range']['max'];
        }
        return null;
    }

    /**
     * Returns all the data obtained about the user.
     *
     * @return array
     */
    public function toArray()
    {
        return $this->data;
    }

    /**
     * Returns a field from the Graph node data.
     *
     * @param string $key
     *
     * @return mixed|null
     */
    private function getField($key)
    {
        return isset($this->data[$key]) ? $this->data[$key] : null;
    }
}

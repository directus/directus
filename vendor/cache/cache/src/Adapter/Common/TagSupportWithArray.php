<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\Common;

/**
 * This trait could be used by adapters that do not have a native support for lists.
 *
 * @author Tobias Nyholm <tobias.nyholm@gmail.com>
 */
trait TagSupportWithArray
{
    /**
     * Get a value from the storage.
     *
     * @param string $name
     *
     * @return mixed
     */
    abstract public function getDirectValue($name);

    /**
     * Set a value to the storage.
     *
     * @param string $name
     * @param mixed  $value
     */
    abstract public function setDirectValue($name, $value);

    /**
     * {@inheritdoc}
     */
    protected function appendListItem($name, $value)
    {
        $data = $this->getDirectValue($name);
        if (!is_array($data)) {
            $data = [];
        }
        $data[] = $value;
        $this->setDirectValue($name, $data);
    }

    /**
     * {@inheritdoc}
     */
    protected function getList($name)
    {
        $data = $this->getDirectValue($name);
        if (!is_array($data)) {
            $data = [];
        }

        return $data;
    }

    /**
     * {@inheritdoc}
     */
    protected function removeList($name)
    {
        $this->setDirectValue($name, []);

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function removeListItem($name, $key)
    {
        $data = $this->getList($name);
        foreach ($data as $i => $value) {
            if ($key === $value) {
                unset($data[$i]);
            }
        }

        return $this->setDirectValue($name, $data);
    }
}

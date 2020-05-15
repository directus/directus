<?php

namespace Directus\Config;

use Directus\Collection\Collection;
use Directus\Config\Exception\InvalidStatusException;
use Directus\Util\ArrayUtils;

class StatusMapping extends Collection
{
    /**
     * @var StatusItem[]
     */
    protected $items;

    public function __construct(array $mapping = [])
    {
        $items = [];

        foreach ($mapping as $value => $status) {
            if (!is_array($status) || !ArrayUtils::contains($status, 'name')) {
                throw new InvalidStatusException('status must be an array with a name attribute');
            }

            $name = ArrayUtils::pull($status, 'name');
            $sort = ArrayUtils::pull($status, 'sort');

            $items[] = new StatusItem($value, $name, $sort, $status);
        }

        parent::__construct($items);
    }

    public function add(StatusItem $status)
    {
        $this->items[] = $status;
    }

    /**
     * Get status by value
     *
     * @param mixed $value
     *
     * @return StatusItem
     */
    public function getByValue($value)
    {
        foreach ($this->items as $item) {
            if ($item->getValue() == $value) {
                return $item;
            }
        }
    }

    /**
     * Returns a list of required status values
     *
     * @return array
     */
    public function getRequiredStatusesValue()
    {
        return $this->getStatusesValue('required_fields', true);
    }
    /**
     * Returns a list of soft delete status values
     *
     * @return array
     */
    public function getSoftDeleteStatusesValue()
    {
        return $this->getStatusesValue('soft_delete', true);
    }

    /**
     * Returns a list of non-soft-delete status values
     *
     * @return array
     */
    public function getNonSoftDeleteStatusesValue()
    {
        return $this->getStatusesValue('soft_delete', [false,null]);
    }

    /**
     * Get all statuses value
     *
     * @return array
     */
    public function getAllStatusesValue()
    {
        $statuses = [];

        foreach ($this->items as $status) {
            $statuses[] = $status->getValue();
        }

        return $statuses;
    }

    /**
     * Get statuses list by the given type
     *
     * @param string $type
     * @param mixed $value
     *
     * @return array
     */
    protected function getStatusesValue($type, $value)
    {
        $statuses = [];
        if(!is_array($value)){
            $value = [$value];
        }
        foreach ($this->items as $status) {
            if (in_array($status->getAttribute($type),$value)) {
                $statuses[] = $status->getValue();
            }
        }

        return $statuses;
    }
}

<?php

class RoomMapForm {

	protected $data = null;

	public function __construct(&$data) {
		$this->data = $data;
	}

	public function isValid() {
		if(!(isset($data['Room Map']) || 0 === strlen(trim($data['Room Map'])) || empty($data['Room Map']))) {
			return false;
		}
		return true;
	}

	public function submit() {
		// @todo left off here
	}

}
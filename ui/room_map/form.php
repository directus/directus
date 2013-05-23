<?php

class RoomMapForm {

	protected $data = null;

	public function __construct(&$data) {
		$this->data = $data;
	}

	public function isValid() {
		return true; // so i can push!
		$data = $this->data;
		if(!(isset($data['Room Map']) || 0 === strlen(trim($data['Room Map'])) || empty($data['Room Map']))) {
			return false;
		}
		return true;
	}

	public function submit() {
		$data = $this->data;
		$map = json_decode($data['Room Map'], true);
		// die(var_dump($map));
	}

}
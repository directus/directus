<?php

$uriWithoutQueryString = trim(str_replace($_SERVER['QUERY_STRING'], '', $_SERVER['REQUEST_URI']), '?');

$request = explode('/', substr($uriWithoutQueryString, 1));
foreach($request as $k => $v)
    if(!$v) unset($request[$k]);
$request = array_values($request);


class cashRegister {

	function __construct($arg1) {
      $this->db = $arg1;
   	}

	function products($searchVal = "") {
		if ($searchVal != "") {
			$searchVal = urldecode($searchVal);
			$query = "SELECT * FROM products WHERE title LIKE '%$searchVal%'";
		} else {
			$query = "SELECT * FROM products";
		}
		$stmt = $this->db->dbh->query($query);
		$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
		return $results;
	}

	function customers($searchVal = "") {
		if ($searchVal == "class") {
			// TODO: room_id needs to be a room in the selected studio...
			// get class start and end time based on class_type_id...
			$query = "SELECT rid.* from riders rid ";
			$query .= "JOIN reservations res ";
			$query .= "ON res.user_id = rid.id ";
			$query .= "JOIN classes cla ";
			$query .= "ON res.class_id = cla.id ";
			$query .= "WHERE cla.datetime < DATE_ADD(NOW(), INTERVAL 1 HOUR) AND cla.datetime >= NOW()";
		} else if ($searchVal != "") {
			$searchVal = urldecode($searchVal);
			$searchArray = explode(" ", $searchVal);
			$query="SELECT * FROM riders WHERE  MATCH (`first_name`, `last_name`, `email`) AGAINST ('";
			$i=0;
			foreach ($searchArray as $word) {
				$query .= "+".$word."* ";
			}
			$query .= "' IN BOOLEAN MODE)";
		} else {
			$query = "SELECT * FROM riders";
		}
		$stmt = $this->db->dbh->query($query);
		$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
		//$results['query'] = $query;
		return $results;
	}

	function omnibox($searchVal = "") {
		if ($searchVal != "") {

		} else {
			$query = "SELECT id, title, 'product' AS `type` FROM products ";
			$query .= "UNION ";
			$query .= "SELECT id, CONCAT(last_name, ', ', first_name,  ' (', email, ')') `title`, 'rider' AS `type` FROM riders";
		}
		$stmt = $this->db->dbh->query($query);
		$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
		return $results;
	}

	function payment_types() {
		$query = "SELECT * FROM payment_types";
		$stmt = $this->db->dbh->query($query);
		$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
		return $results;
	}

}

$cashRegister = new cashRegister($db);

$params = array_slice($request, 5);

/**
 * @todo this is unstable and very insecure, calling a method by name using an
 * unsanitized user input!
 */
$results = call_user_func_array(array($cashRegister, $params[0]), array_slice($params, 1));

/**
 * Return the results to the API front controller.
 */
return $results;

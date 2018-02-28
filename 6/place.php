<?php 
	

	// call Google Geocoding API - convert address to coordinates
	function get_coords_by_address($address) {
		
		$api_key = "AIzaSyAuthszQ_BKIMTuH8OlE3OgGF_uW6hbaIs";
		$address = urlencode($address);		

		$api_baseurl = "https://maps.googleapis.com/maps/api/geocode/json?";
		$request_url = $api_baseurl."address=$address"."&key=$api_key";

		$response = json_decode(file_get_contents($request_url), true);

		$latitude = $response["results"][0]["geometry"]["location"]["lat"];
		$longitude = $response["results"][0]["geometry"]["location"]["lng"];
		$coords = "$latitude,$longitude";

		return $coords;
	}

	// call Google Nearby Place Search API
	function nearby_search($keyword, $type, $radius, $location) {

		$api_key = "AIzaSyCKdJ9bVn6LMk0O8CU-Dzc9HmIj5fi5AuU";

		// urlencode params
		$keyword = urlencode($keyword);
		$type = urlencode($type);
		$radius = urlencode($radius * 1609.34);
		$location = urlencode($location);


		$api_baseurl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?";
		$request_url = $api_baseurl."keyword=$keyword"."&type=$type"."&radius=$radius"."&location=$location"."&key=$api_key";		
		$response = file_get_contents($request_url);

		return $response;
	}

	// check whether data has been POSTed
	if (!empty($_POST["search"])) {

		// if the user clicks on search button		
		if ($_POST["search"] == "nearby") {

			// get coordinates or convert to coordinates
			if ($_POST["location_type"] == "address")
				$coords = get_coords_by_address($_POST["loc"]);	
			else
				$coords = $_POST["loc"];									

			// call the Nearby Place Search API
			$response = nearby_search($_POST["keyword"], $_POST["category"], $_POST["distance"], $coords);

			// use exit instead of echo to prevent entire HTML page from getting returned
			exit($response);
		}

		// if the user clicks on place returned by nearby search
		else if($_POST["search"] == "details") {

		}
	}

?>

<html>
	<head>
		<title>Travel and Entertainment Search</title>

		<style>
			#search-box {
				width: 50%;
				margin: 0 auto;
				border: 3px solid #ccc;
				padding: 5px;
				background-color: #f7f7f7;
			}
			
			#search-box h1 {
				text-align: center;
				font-style: italic;
			}

			#search-box label {
				font-weight: bold;
				display: inline-block;
				margin-bottom: 10px;
			}

			#search-box #location-radio {
				display: inline-block;				
			}

		</style>
	</head>

	<body onload="javascript:getLocation()">
		<div id="search-box">
			<h1>Travel and Entertainment Search</h1>
			<hr>
			<form onsubmit="event.preventDefault(); validateInput()">
				<label for="keyword">Keyword</label>
				<input type="text" name="keyword" id="input-keyword" autofocus required>
				<br>

				<label for="category">Category</label>
				<select name="category" id="input-category">
					<option value="default">Default</option>
					<option value="cafe">Cafe</option>
					<option value="bakery">Bakery</option>
					<option value="restaurant">Restaurant</option>
					<option value="beauty_salon">Beauty Salon</option>
					<option value="casino">Casino</option>
					<option value="movie_theater">Movie Theater</option>
					<option value="lodging">Lodging</option>
					<option value="airport">Airport</option>
					<option value="train_station">Train Station</option>
					<option value="subway_station">Subway Station</option>
					<option value="bus_station">Bus Station</option>
				</select>
				<br>

				<label for="distance">Distance (miles)</label>
				<input type="text" name="distance" id="input-distance" placeholder="10" pattern="\d+">
				
				<label for="location">from</label>
				<div id="location-radio">					
					<input type="radio" name="location" class="radio-loc" value="here" checked onclick="javascript:dontRequireLocation()"> Here <br>
					<input type="radio" name="location" class="radio-loc" value="there" onclick="javascript:requireLocation()"> 
					<input type="text" name="location" id="input-location" placeholder="Location">					
				</div>
				<br>
				<br>
				<br>				

				<input type="submit" value="Search" id="search-button" disabled> 
				<input type="reset" value="Clear">
			</form>
		</div>

		<script>
			/* when the page has loaded, get user location and enable the search button */
			function getLocation() {
				var xhr = new XMLHttpRequest(); 
				xhr.open("GET", "http://ip-api.com/json/", false);
				xhr.send();
				try	{
					if(xhr.status != 200)
						throw xhr.status;
				}
				catch(error_status) {
					console.log("Fetching geolocation failed with HTTP status code " + error_status);
					return;
				}

				json_response = xhr.responseText;
				data = JSON.parse(json_response);				
				document.getElementById("search-button").removeAttribute("disabled");

				var user_latitude = data.lat;
				var user_longitude = data.lon;
				
				// global
				user_location = user_latitude + "," + user_longitude;
				console.log("Fetched user location: (" + user_latitude + ", " + user_longitude + ")");
			}

			function requireLocation() {		
				document.getElementById("input-location").setAttribute("required", "");				
			}
			
			function dontRequireLocation() {
				document.getElementById("input-location").removeAttribute("required");				
			}

			function validateInput() {
				keyword = document.getElementById("input-keyword").value;
				category = document.getElementById("input-category").value;
				distance = document.getElementById("input-distance").value;
				if (distance == "")
					distance = 10;

				radio = document.getElementsByClassName("radio-loc");								
				if (radio[0].checked) {
					location_type = "coords";

					// can't use location as a variable name because it refers to window.location
					loc = user_location;
				}
				else {
					location_type = "address";					
					loc = document.getElementById("input-location").value;
				}

				submitForm(keyword, category, distance, location_type, loc);				
			}

			function submitForm(keyword, category, distance, location_type, loc) {
				var xhr = new XMLHttpRequest();
				xhr.open("POST", "place.php", true);
				xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				xhr.onreadystatechange = function() {					
					if (xhr.readyState == 4 && xhr.status == 200) {
						console.log(xhr.responseText);
						// response = JSON.parse(xhr.responseText);
						// displayData(response);
					}
				}
				xhr.send("search=nearby" +
						"&keyword=" + keyword +
						"&category=" + category + 
						"&distance=" + distance + 
						"&location_type=" + location_type + 
						"&loc=" + loc);		
			}

		</script>
	</body>
</html>


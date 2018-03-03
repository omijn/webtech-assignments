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
		$response = json_decode(file_get_contents($request_url), true);

		// remove useless data from response
		$clean_response = array();
		foreach ($response["results"] as $index => $result) {
			$clean_response["results"][$index] = array();
			$clean_response["results"][$index]["category"] = $result["icon"];
			$clean_response["results"][$index]["name"] = $result["name"];
			$clean_response["results"][$index]["address"] = $result["vicinity"];
			$clean_response["results"][$index]["place_id"] = $result["place_id"];
			$clean_response["results"][$index]["coords"] = $result["geometry"]["location"]["lat"].",".$result["geometry"]["location"]["lng"];	// used to center map
		}				

		$clean_response["from_coords"] = urldecode($location);	// save this now so that the coordinates don't have to be fetched again while rendering the map
		return json_encode($clean_response);		
	}

	function detail_search($place_id) {
		$api_key = "AIzaSyCKdJ9bVn6LMk0O8CU-Dzc9HmIj5fi5AuU";

		$api_baseurl = "https://maps.googleapis.com/maps/api/place/details/json?";
		$request_url = $api_baseurl."placeid=$place_id"."&key=$api_key";
		$response = json_decode(file_get_contents($request_url), true);
		
		// exit(json_encode($response));

		$clean_response = array("photos" => array(), "reviews" => array());		
		foreach ($response["result"]["photos"] as $key => $photo_obj) {
			if ($key > 4)	// save only upto 5 photos
				break;
			$ref = $photo_obj["photo_reference"];
			$width = $photo_obj["width"];
			$photo = photo_search($ref, $width);
			$filename = "$place_id"."_"."img".$key;
			file_put_contents($filename, $photo);

			$clean_response["photos"][$key] = $filename;
		}

		foreach ($response["result"]["reviews"] as $key => $review_obj) {
			if ($key > 4)	// save only upto 5 reviews
				break;
			$author_name = $review_obj["author_name"];
			$author_photo = $review_obj["profile_photo_url"];
			$review = $review_obj["text"];

			$clean_response["reviews"][$key] = array("author_name" => $author_name, "author_photo" => $author_photo, "review" => $review);
		}

		return json_encode($clean_response);
	}

	function photo_search($ref, $width) {
		$api_key = "AIzaSyAuthszQ_BKIMTuH8OlE3OgGF_uW6hbaIs";

		$api_baseurl = "https://maps.googleapis.com/maps/api/place/photo?";
		$request_url = $api_baseurl."maxwidth=$width"."&photoreference=$ref"."&key=$api_key";
		$photo = file_get_contents($request_url);
		return $photo;
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

			// use exit to prevent returning HTML
			exit($response);
		}

		// if the user clicks on place returned by nearby search
		else if($_POST["search"] == "detail") {
			$response = detail_search($_POST['place_id']);
			exit($response);
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

			table {
				margin: 20px auto 0;				
			}

			table, th, td {			    
			    border: 2px solid #ccc;
			    border-collapse: collapse;
			}

			th, td {
				padding: 5px;				
			}

			td img {
				width: 30px;				
			}
	
			td a {
				text-decoration: none;
				color: #000;
			}

			td a:hover {
				color: #666;
				cursor: pointer;
			}

			div.error {
				margin: 0 auto;
				border: 2px solid #ccc;
				padding: 5px;
				background-color: #f7f7f7;
				text-align: center;
				width: 70%;
				margin-top: 20px;
			}
			
			#place-name {
				font-weight: bold;
				text-align: center;
				margin: 20px auto 0;
			}

			#review-wrapper, #photo-wrapper	{
				margin: 20px auto;
				text-align: center;
				cursor: pointer;
				width: 40%;
			}

			#review-wrapper img, #photo-wrapper img {
				width: 50px;
			}

			table#review-table, table#photo-table  {
				width: 50%;
			}

			table tr.center-row {
				text-align: center;
			}
			
			table#photo-table td {
				padding: 20px;
			}
		
			table#photo-table img.big-img {
				width: 100%;
			}

			span.author-name {
				font-weight: bold;
			}

			.map {
				position: absolute;
				width: 400px;
				height: 400px;
			}

			.dir-options {
				position: absolute;				
			}

			.dir-options div {
				padding: 10px;
				background: #f7f7f7;
				cursor: pointer;
			}

			.dir-options div:hover {
				background: #e5e5e5;				
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
					<input type="text" name="location" id="input-location" placeholder="Location" disabled>					
				</div>
				<br>
				<br>
				<br>				

				<input type="submit" value="Search" id="search-button" disabled> 
				<input type="button" value="Clear" onclick="clr(); setDefaults();">
			</form>
		</div>
		
		<div id="result-area"></div>

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
				document.getElementById("input-location").removeAttribute("disabled");
			}
			
			function dontRequireLocation() {
				document.getElementById("input-location").removeAttribute("required");				
				document.getElementById("input-location").setAttribute("disabled", "");
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
						nearby_data = JSON.parse(xhr.responseText);						
						displayNearbyData(nearby_data);
					}
				}

				xhr.send("search=nearby" +
						"&keyword=" + keyword +
						"&category=" + category + 
						"&distance=" + distance + 
						"&location_type=" + location_type + 
						"&loc=" + loc);		
			}

			function displayNearbyData(data) {							
				// clear result area before displaying new data
				clr();

				var template = document.createElement("template");	// cool HTML5 stuff

				// if nearby search returns results
				if (data.results.length	!= 0) {
					var table = "<table id='nearby-results-table'><thead><tr><th>Category</th><th>Name</th><th>Address</th></tr></thead><tbody>";
					for (let entry of data.results) {
						table += "<tr>";
						table += "<td><img src='" + entry.category + "' alt='category-icon'></td>";
						table += "<td><a onclick=\"javascript:getDetails('" + entry.place_id + "', '" + escape(entry.name) + "')\">" + entry.name + "</a></td>";
						table += "<td id='address-" + entry.place_id + "'><a onclick=\"javascript:getMap('" + data.from_coords + "', '" + entry.place_id + "', '" + entry.coords + "')\">" + entry.address + "</a></td>";
						table += "</tr>";
					}

					table += "</tbody></table>";

					table = table.trim();					
					template.innerHTML = table;
				}

				// if nearby search returns no results
				else {
					error = "<div class='error'>No records have been found.</div>";
					template.innerHTML = error;					
				}

				document.getElementById("result-area").appendChild(template.content.firstChild);
				// console.log(data);
			}

			/* clear result area 
			 * NOTE - clear can't be used as a function name */
			function clr() {				
				var result_div = document.getElementById("result-area");
				while(result_div.hasChildNodes()) {
					result_div.removeChild(result_div.lastChild);
				}
			}

			function setDefaults() {
				document.getElementById("input-keyword").value = "";
				document.getElementById("input-keyword").focus();

				document.getElementById("input-category").value = "default";
				document.getElementById("input-distance").value = "";
				document.getElementsByClassName("radio-loc")[0].checked = true;

				document.getElementById("input-location").value = "";
				document.getElementById("input-location").setAttribute("disabled", "");
			}

			function getDetails(place_id, place_name) {
				var xhr = new XMLHttpRequest();
				xhr.open("POST", "place.php", true);
				xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4 && xhr.status == 200) {
						console.log(xhr.responseText);
						detailed_data = JSON.parse(xhr.responseText);
						displayDetailedData(detailed_data, place_name);
					}
				}

				xhr.send("search=detail" + 
						"&place_id=" + place_id);
			}

			function displayDetailedData(data, name) {
				clr();

				var template = document.createElement("template");

				var name = "<p id='place-name'>" + unescape(name) + "</p>";

				// reviews				
				var wrapper1 = "<div id='review-wrapper' onclick='toggleReviews()'>";
				wrapper1 += "<span id='review-toggle-text'>click to show reviews</span><br>";
				wrapper1 += "<img id='review-toggle-img' src='http://cs-server.usc.edu:45678/hw/hw6/images/arrow_down.png'>";
				wrapper1 += "</div>";

				var table1 = "";
				if (data.reviews.length == 0) {
					table1 += "<div style='display:none' id='review-table' class='error'>No reviews found.</div>";
				}
				else {
					table1 = "<table style='display:none' id='review-table'><tbody>";
					for (let review of data.reviews) {
						table1 += "<tr class='center-row'><td>";
						table1 += "<img src='" + review.author_photo + "'>";
						table1 += "<span class='author-name'>" + review.author_name + "</span>";
						table1 += "</td></tr>";

						table1 += "<tr><td>";
						table1 += review.review;
						table1 += "</td></tr>";
					}					
					table1 += "</tbody></table>";							
				}

				// photos
				var wrapper2 = "<div id='photo-wrapper' onclick='togglePhotos()'>";
				wrapper2 += "<span id='photo-toggle-text'>click to show photos</span><br>";
				wrapper2 += "<img id='photo-toggle-img' src='http://cs-server.usc.edu:45678/hw/hw6/images/arrow_down.png'>";
				wrapper2 += "</div>";

				var table2 = "";
				if (data.photos.length == 0) {
					table2 += "<div style='display:none' id='photo-table' class='error'>No photos found.</div>";
				}
				else {
					table2 += "<table style='display:none' id='photo-table'><tbody>";
					for (let photo of data.photos) {
						table2 += "<tr class='center-row'><td>";
						table2 += "<a target='_blank' href='" + photo + "'><img class='big-img' src='" + photo + "'></a>";
						table2 += "</td></tr>";
					}					
					table2 += "</tbody></table>";
				}
				
				template.innerHTML = name + wrapper1 + table1 + wrapper2 + table2;
				document.getElementById("result-area").appendChild(template.content);
			}

			function showReviews() {
				document.getElementById("review-table").style.display = "table";
				document.getElementById("review-toggle-text").innerHTML = "click to hide reviews";
				document.getElementById("review-toggle-img").src = "http://cs-server.usc.edu:45678/hw/hw6/images/arrow_up.png";
			}

			function hideReviews() {
				document.getElementById("review-table").style.display = "none";
				document.getElementById("review-toggle-text").innerHTML = "click to show reviews";
				document.getElementById("review-toggle-img").src = "http://cs-server.usc.edu:45678/hw/hw6/images/arrow_down.png";
			}

			function toggleReviews() {

				if (document.getElementById("review-table").style.display == "none") {
					showReviews();
					hidePhotos();
				}			
				else {
					hideReviews();					
				}
			}

			function showPhotos() {
				document.getElementById("photo-table").style.display = "table";
				document.getElementById("photo-toggle-text").innerHTML = "click to hide photos";
				document.getElementById("photo-toggle-img").src = "http://cs-server.usc.edu:45678/hw/hw6/images/arrow_up.png";
			}

			function hidePhotos() {
					document.getElementById("photo-table").style.display = "none";
					document.getElementById("photo-toggle-text").innerHTML = "click to show photos";
					document.getElementById("photo-toggle-img").src = "http://cs-server.usc.edu:45678/hw/hw6/images/arrow_down.png";
			}

			function togglePhotos() {								
				if (document.getElementById("photo-table").style.display == "none") {
					showPhotos();
					hideReviews();
				}
				else {
					hidePhotos();
				}
			}

			function getMap(from_coords, place_id, coords) {
				
				// close map if already open
				var m = document.getElementById("map-" + place_id);
				if (m) {
					m.parentNode.removeChild(m);
					return;			
				}

				// create map div
				var d = document.createElement("div");
				d.id = "map-" + place_id;
				d.classList.add("map");
				var reference_node = document.getElementById("address-" + place_id);
				reference_node.insertBefore(d, reference_node.nextSibling);

				coords = coords.replace(" ", "").split(",");
				var place = {lat: parseFloat(coords[0]), lng: parseFloat(coords[1])};

				var map = new google.maps.Map(document.getElementById('map-' + place_id), {
					zoom: 16,
					center: place
				});

				// save map globally				
				window.maps["map-" + place_id] = map;
				var marker = new google.maps.Marker({
					position: place,
					map: map
				});

				// create directions
				var t = document.createElement('template');	// to create element from string
				var dir = "<div class='dir-options'>" + 
					"<div onclick=walk('" + from_coords + "','" + place_id + "')>Walk there</div>" +
					"<div onclick=bike('" + from_coords + "','" + place_id + "')>Bike there</div>" + 
					"<div onclick=drive('" + from_coords + "','" + place_id + "')>Drive there</div>" + 
				"</div>";

				t.innerHTML = dir.trim();
				d.appendChild(t.content);

			}

			function walk(from_coords, place_id) {
				from_coords = from_coords.replace(" ", "").split(",");

				var directionsRequestObject = {
					origin: { lat: parseFloat(from_coords[0]), lng: parseFloat(from_coords[1]) },
					destination: { placeId: place_id },
					travelMode: "WALKING"
				};

				renderDirections(directionsRequestObject, place_id);
			}

			function bike(from_coords, place_id) {
				from_coords = from_coords.replace(" ", "").split(",");

				var directionsRequestObject = {
					origin: { lat: parseFloat(from_coords[0]), lng: parseFloat(from_coords[1]) },
					destination: { placeId: place_id },
					travelMode: "BICYCLING"
				};

				renderDirections(directionsRequestObject, place_id);
			}

			function drive(from_coords, place_id) {
				from_coords = from_coords.replace(" ", "").split(",");

				var directionsRequestObject = {
					origin: { lat: parseFloat(from_coords[0]), lng: parseFloat(from_coords[1]) },
					destination: { placeId: place_id },
					travelMode: "DRIVING"
				};

				renderDirections(directionsRequestObject, place_id);
			}

			function renderDirections(directionsRequestObject, place_id) {
				var directionsService = new google.maps.DirectionsService();
				
				directionsService.route(directionsRequestObject, function(result, status) {
					if (status == "OK") {
						// check whether a DirectionRenderer for a particular map already exists
						if (window.directionsRenderers["map-" + place_id]) {
							window.directionsRenderers["map-" + place_id].set('directions', null);
						}
						// otherwise create a new one
						else {
							var directionsDisplay = new google.maps.DirectionsRenderer({
								map: window.maps["map-" + place_id]
							});

							// save renderers so that we can clear previous directions instead of overlapping
							window.directionsRenderers["map-" + place_id] = directionsDisplay;				
						}						
						
						window.directionsRenderers["map-" + place_id].setDirections(result);
					}
				})

			}
			window.directionsRenderers = [];
			window.maps = [];
		</script>
		<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyD_osgzTFg21KVMoWaxZ3aKzBKbb7t_b4s" async defer></script>
	</body>
</html>


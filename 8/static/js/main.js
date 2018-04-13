function enableSearchBtn() {
	if(localStorage.user_latitude)
		$("#search-button").removeAttr("disabled").removeClass("btn-secondary").addClass("btn-primary")
}

function disableSearchBtn() {
	$("#search-button").attr("disabled", "disabled").removeClass("btn-primary").addClass("btn-secondary")
}

function isValidInput(selector) {
	if ($(selector).val().trim() == "") {
		$(selector).removeClass("is-valid").addClass("is-invalid").next(".error").removeClass("d-none")
		return false
	}
	else {
		$(selector).removeClass("is-invalid").addClass("is-valid").next(".error").addClass("d-none")
		return true
	}
}

function isValidForm() {
	var status = isValidInput("#input-keyword")
	
	if ($("#radio-there").is(":checked")) {
		status = isValidInput("#input-location")	
	}

	return status
}

$("#radio-here").click(() => {
	if ($("#radio-here").is(":checked")) {
		$("#input-location").attr("disabled", "disabled").removeClass("is-invalid").removeClass("is-valid").next(".error").addClass("d-none")
		checkForm()
	}
})

$("#radio-there").click(() => {
	if ($("#radio-there").is(":checked")) {
		if ($("#input-location").val().trim() == "")
			disableSearchBtn()
		$("#input-location").removeAttr("disabled")
	}
})

function checkForm() {
	if (isValidForm())
		enableSearchBtn()	
	else
		disableSearchBtn()	
}

$("form .form-control").on("blur change keyup paste mouseup", checkForm)

$(document).ready(() => {
	$.ajax({
		url: "http://ip-api.com/json/",
		method: "GET",
		success: (data, status, xhr) => {			
			console.log(data.lat + ", " + data.lon)
			localStorage.user_latitude = data.lat
			localStorage.user_longitude = data.lon			
		},
		error: (xhr, status, errorMsg) => {
			console.log("Failed to get user location: " + errorMsg)
		}		
	})
})

// autocomplete
autocomplete = new google.maps.places.Autocomplete($("#input-location")[0])

// nearby search
function nearby_search(params) {	
	$.ajax({
		url: '/nearby',
		method: 'GET',		
		data: params,
		success: (data, status, xhr) => {
			displayNearbyResults(JSON.parse(data))
		},
		error: (xhr, status, errorMsg) => {
			console.log(errorMsg)
		},
		complete: () => {
			$(".progress").addClass("d-none")
		}
	})
}

$("#search-button").click(() => {
	$(".progress").removeClass("d-none")
	if ($("#radio-here").is(":checked")) {
		var location_type = "coords"
		var loc = localStorage.user_latitude + "," + localStorage.user_longitude
	}
	else {
		var location_type = "address"
		var loc = $("#input-location").val()
	}

	var distance = $("#input-distance").val()
	if (distance == "")
		distance = 10

	var params = {
		keyword: $("#input-keyword").val(),
		category: $("#input-category").val(),
		distance: distance,
		location_type: location_type,
		loc: loc
	}

	nearby_search(params)
})

function displayNearbyResults(data) {
	clr()

	if (data.results.length != 0) {
		var html = "<table class=\"table\"> \
		<thead> \
		<th scope=\"col\">#</th> \
		<th scope=\"col\">Category</th> \
		<th scope=\"col\">Name</th> \
		<th scope=\"col\">Address</th> \
		<th scope=\"col\">Favorite</th> \
		<th scope=\"col\">Details</th> \
		</thead> \
		<tbody>"

		for (var i = 0; i < data.results.length; i++) {
			var index = i + 1
			html += "<tr>" +
			"<td>" + index + "</td>" +
			"<td><img width=30 src='" + data.results[i].icon + "' alt='category-icon'></td>" +
			"<td>" + data.results[i].name + "</td>" +
			"<td>" + data.results[i].address + "</td>" +
			"<td><button class='btn btn-light' onclick=\"javascript:fav('" + data.results[i].place_id + "')\"><i class=\"far fa-star\"></i></button></td>" +
			"<td><button class='btn btn-light' onclick=\"javascript:getDetails('" + data.results[i].place_id + "', 'results')\"><i class=\"fas fa-chevron-right\"></i></button></td>" +
			"</tr>"
		}

		html += "</tbody></table>"

		$("#pills-results-content").append(html)
	}
	else {
		var html = `<div class="alert alert-warning" role="alert">
		No results
		</div>`

		$("#pills-results-content").append(html)	
	}
}

function getDetails(place_id, fromTable) {	

	var request = {
		placeId: place_id
	}

	var map = $("#map")[0]	
	
	service = new google.maps.places.PlacesService(map);
	service.getDetails(request, (place, status) => {
		if (status == google.maps.places.PlacesServiceStatus.OK) {	
			// populate map
			var map = new google.maps.Map($("#map")[0], {
				center: place.geometry.location,
				zoom: 16
			});

			var marker = new google.maps.Marker({
				map: map,
				position: place.geometry.location
			})			

			$("#input-directions-to").val(place.name + ", " + place.formatted_address)
			localStorage.to_coordinates = place.geometry.location

			// display stuff above tabs - place name and buttons
			$("#place-name").text(place.name)
			$("#button-row").removeClass("d-none")

			$("#tweet-button").off("click")
			$("#tweet-button").on("click", () => {
				var text = "Check out " + place.name + " located at " + place.formatted_address + ". Website: " + place.website
				var hashtags = "TravelAndEntertainmentSearch"
				window.open("https://twitter.com/intent/tweet?text=" + text + "&hashtags=" + hashtags, "_blank")
			})			

			$("#back-button").off("click")
			$("#back-button").on("click", () => {				
				$("#place-name").text("")
				$("#details-area").addClass("d-none")
				$("#info-content").empty()
				$(".gallery-column").empty()
				$("#review-container").remove()
				$("#tweet-button").off("click")
				$("#button-row").addClass("d-none")

				// show old table
				$("#pills-" + fromTable + "-content").removeClass("d-none")
			})

			// populate info
			var info_table = "<table class=\"table table-striped\"><tbody>"
			if (place.formatted_address)
				info_table += "<tr><th>Address</th><td>" + place.formatted_address + "</td>"
			if (place.international_phone_number)
				info_table += "<tr><th>Phone Number</th><td>" + place.international_phone_number + "</td>"
			if (place.price_level)
				info_table += "<tr><th>Price Level</th><td>" + "$".repeat(place.price_level) + "</td>"
			if (place.rating)
				info_table += "<tr><th>Rating</th><td>" + place.rating + "</td>"
			if (place.url)
				info_table += "<tr><th>Google Page</th><td><a target='_blank' href=\"" + place.url + "\">" + place.url + "</a></td>"
			if (place.website)
				info_table += "<tr><th>Website</th><td><a target='_blank' href=\"" + place.website + "\">" + place.website + "</a></td>"
			if (place.opening_hours)
				info_table += "<tr><th>Hours</th><td>" + ((place.opening_hours.open_now)?"Open Now: <a>Today's Hours</a>":"Closed") + "</td>"

			info_table += "</tbody></table>"

			$("#info-content").html(info_table)

			// populate photos
			if (place.photos) {
				for (let i = 0; i < place.photos.length; i++) {
					var small_url = place.photos[i].getUrl({'maxWidth': 200});
					var full_url = place.photos[i].getUrl({'maxWidth': 2000});
					$(".gallery-column:eq(" + parseInt(i)%4 + ")").append("<a target='_blank' href=\"" + full_url + "\"><img src=\"" + small_url + "\"></a>")
				}				
			}
			else {
				$("#photos-content").append(`<div class="alert alert-warning" role="alert">No results</div>`)				
			}						

			// populate reviews
			reviews_html = "<div id=\"review-container\">"
			if(place.reviews) {			
				for (let r of place.reviews) {				
					var card = "\
					<div class=\"card mb-2\"> \
					<div class=\"card-body\">\
					<div class=\"row\">\
					<div class=\"col-md-2\">\
					<img width=50 src=\"" + r.profile_photo_url + "\" />\
					</div>\
					<div class=\"col-md-10\">\
					<h5 class=\"card-title\"><a target='_blank' href=\"" + r.author_url + "\">" + r.author_name + "</a></h5> \
					<h6 class=\"card-subtitle mb-2 text-muted\">" + getTimeString(new Date(parseInt(r.time) * 1000)) + "</h6> \
					<p class=\"card-text\">" + r.text + "</p> \
					</div>\
					</div>\
					</div>\
					</div>"

					reviews_html += card
				}
			}
			else {
				reviews_html += `<div class="alert alert-warning" role="alert">No results</div>`
			}

			reviews_html += "</div>"

			$("#reviews-content").append(reviews_html)

			// hide old table
			$("#pills-" + fromTable + "-content").addClass("d-none")

			// show details area (info, photos, map, reviews)
			$("#details-area").removeClass("d-none")
		}
	});	
}

function pzero(num) {
	return (num < 10)?'0' + num: num
}

function getTimeString(d) {
	return d.getUTCFullYear() + "-" + pzero(d.getUTCMonth()) + "-" + pzero(d.getUTCDate()) + " " + pzero(d.getUTCHours()) + ":" + pzero(d.getUTCMinutes()) + ":" + pzero(d.getUTCSeconds())
}

$("#clear-button").click(() => {
	clr()
	setDefaults()
})

function clr() {
	$("#pills-results-content").empty()
	$("#pills-results-content").removeClass("d-none")
	$("#place-name").text("")
	$("#details-area").addClass("d-none")
	$("#info-content").empty()
	$(".gallery-column").empty()
	$("#review-container").remove()
	$("#tweet-button").off("click")
	$("#button-row").addClass("d-none")
	$(".alert").remove()
}

function setDefaults() {
	$("#input-keyword").val("");
	$("#input-keyword").focus();

	$("#input-category").val("default");
	$("#input-distance").val("");
	$("input[name='location']")[0].checked = true;

	$("#input-location").val("");
	$("#input-location").attr("disabled", "disabled");
}
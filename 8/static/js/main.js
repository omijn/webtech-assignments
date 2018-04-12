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
		method: 'POST',
		contentType: 'application/json',
		data: JSON.stringify(params),
		success: (data, status, xhr) => {
			displayNearbyResults(JSON.parse(data))
		},
		error: (xhr, status, errorMsg) => {
			console.log(errorMsg)
		}
	})
}

$("#search-button").click(() => {
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

	if (data.results != []) {
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

			$("#input-directions-to").val(place.formatted_address)

			// populate info
			$("#info-content").html(place.formatted_address + "<br>" + place.international_phone_number + "<br>" + place.price_level + "<br>" + place.rating + "<br>" + place.url + "<br>" + place.website + "<br>" + place.opening_hours.open_now)

			// populate photos
			for (var i = 0; i < place.photos.length; i++) {
				var url = place.photos[i].getUrl({'maxWidth': 200});
				$(".gallery-column:eq(" + parseInt(i)%4 + ")").append("<img src=\"" + url + "\">")
			}

			// populate reviews

			// hide old table
			$("#pills-" + fromTable + "-content").addClass("d-none")

			// show details area (info, photos, map, reviews)
			$("#details-area").removeClass("d-none")
		}
	});	
}

$("#clear-button").click(() => {
	clr()
	setDefaults()
})

function clr() {
	$("#pills-results-content").empty()
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
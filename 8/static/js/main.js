function enableSearchBtn() {
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
			console.log(data)
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
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
			// enableSearchBtn()
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
autocomplete = new google.maps.places.Autocomplete($("#input-keyword")[0])
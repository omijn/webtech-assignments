function enableSearchBtn() {
	$("#search-button").removeAttr("disabled")	
}

$(document).ready(() => {
	$.ajax({
		url: "http://ip-api.com/json/",
		method: "GET",
		success: (data, status, xhr) => {
			enableSearchBtn()
			console.log(data.lat + ", " + data.lon)
			localStorage.user_latitude = data.lat
			localStorage.user_longitude = data.lon
		},
		error: (xhr, status, errorMsg) => {
			console.log("Failed to get user location: " + errorMsg)
		}		
	})
})
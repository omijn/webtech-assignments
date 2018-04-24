const express = require('express')
const path = require('path')
const request = require('request')
const googleMapsClient = require('@google/maps').createClient({
	key: 'AIzaSyD1lLYLgXAV3QT8diQ-J2P5Av0KyErEag8'
});

const app = express()

app.use(express.static('static'))
app.set('port', process.env.PORT || 8081)

app.get('/nearby', (req, res, next) => {	

	res.locals.keyword = req.query.keyword
	res.locals.category = req.query.category
	res.locals.distance = req.query.distance * 1609.34
	var location_type = req.query.location_type
	res.locals.loc = req.query.loc

	if (location_type == "address") {
		googleMapsClient.geocode({
			address: res.locals.loc
		}, (err, response) => {

			if (!err) {
				var lat = response.json.results[0].geometry.location.lat
				var lng = response.json.results[0].geometry.location.lng
				res.locals.loc = lat + "," + lng
				next()
			}
			else
				console.log(err)
		})
	}

	else {
		next()
	}
	
}, (req, res) => {
	googleMapsClient.placesNearby({
		keyword: res.locals.keyword,
		type: res.locals.category,
		radius: res.locals.distance,
		location: res.locals.loc
	}, (err, response) => {
		if (!err) {
			// console.log(response.json)
			nearby_response = {}
			nearby_response.next_page_token = response.json.next_page_token
			nearby_response.results = []
			for (let r of response.json.results) {
				single_result = {}
				single_result.place_id = r.place_id
				single_result.icon = r.icon
				single_result.name = r.name
				single_result.address = r.vicinity
				single_result.coords = r.geometry.location.lat + "," + r.geometry.location.lng
				nearby_response.results.push(single_result)
			}			
			res.send(JSON.stringify(nearby_response))
		}
		else
			console.log(err)
	})
})

app.get('/details', (req, res) => {
	googleMapsClient.place({
		// params
		placeid: req.query.place_id
	}, (err, response) => {
		if (!err) {			
			res.send(response)
		}
	})
})


app.listen(app.get('port'), () => console.log('App listening.'))

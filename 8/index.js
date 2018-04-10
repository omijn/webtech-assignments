const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const request = require('request')
const googleMapsClient = require('@google/maps').createClient({
	key: 'AIzaSyD1lLYLgXAV3QT8diQ-J2P5Av0KyErEag8'
});

const app = express()

var jsonParser = bodyParser.json()

app.use(express.static('static'))

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname + '/index.html'))
})

app.post('/nearby', jsonParser, (req, res) => {
	
	var keyword = req.body.keyword
	var category = req.body.category
	var distance = req.body.distance * 1609.34
	var location_type = req.body.location_type
	var loc = req.body.loc

	if (location_type == "address") {
		googleMapsClient.geocode({
			address: loc
		}, (err, response) => {

			if (!err) {
				var lat = response.json.results[0].geometry.location.lat
				var lng = response.json.results[0].geometry.location.lng
				var loc = lat + "," + lng
				nearbySearch(keyword, category, distance, loc)
			}
			else
				console.log(err)
		})
	}

	else {
		nearbySearch(keyword, category, distance, loc)
	}

	res.send("reached /nearby route successfully")
})

function nearbySearch(keyword, type, radius, location) {
	googleMapsClient.placesNearby({
		keyword: keyword,
		type: type,
		radius: radius,
		location: location
	}, (err, response) => {
		if (!err) {
			console.log(response.json)
		}
		else
			console.log(err)
	})
}

app.listen(2999, () => console.log('App listening on port 2999'))
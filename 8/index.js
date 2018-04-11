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

app.post('/nearby', jsonParser, (req, res, next) => {
	
	res.locals.keyword = req.body.keyword
	res.locals.category = req.body.category
	res.locals.distance = req.body.distance * 1609.34
	var location_type = req.body.location_type
	res.locals.loc = req.body.loc

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
				single_result.address = r.vicinity
				single_result.coords = r.geometry.location.lat + "," + r.geometry.location.lng
				nearby_response.results.push(single_result)
			}
			console.log(nearby_response)
			res.send(JSON.stringify(nearby_response))
		}
		else
			console.log(err)
	})
})

app.listen(2999, () => console.log('App listening on port 2999'))
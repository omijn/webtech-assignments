const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')

const app = express()

var jsonParser = bodyParser.json()

app.use(express.static('static'))

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname + '/index.html'))
})

app.post('/nearby', jsonParser, (req, res) => {
	
	var keyword = req.body.keyword
	var category = req.body.category
	var distance = req.body.distance
	var location_type = req.body.location_type
	var loc = req.body.loc
	
	res.send("reached /nearby route successfully")
})

app.listen(2999, () => console.log('App listening on port 2999'))
var db = require('./models/index.js');
var wkt = require('wkt');
var polyline = require('@mapbox/polyline');
var express = require("express");
var cors = require('cors');
var app = express();
app.use(express.json());
app.use(cors())

// GET single segment by its ID
app.get("/segment", (req, res, next) => {
	// look up the segment by its id, return all info
	var segment_id = req.query.id
	var segment = db.Segment.findByPk(parseInt(segment_id)).then(segment => {
		if (segment instanceof db.Segment) {
			segment.route = polyline.fromGeoJSON(segment.route);
			res.json(segment)
		} else {
			res.json({})
		}
	});

});


// POST register new segment
app.post('/segment', (req, res) => {
	// make a new segment
	var route = req.body.route
	if (typeof route == 'string') {
		// if the route has come in as a polyline
		// make it into a GeoJSON object for the db
		route = polyline.toGeoJSON(route);
	}

	obj = {
		name: req.body.name,
		description: req.body.description,
		route: route
	}
	db.Segment.create(obj)
	res.send('created');
})

app.get("/segments", (req, res, next) => {
	// look up the segment by its id, return all info
	db.Segment.findAll().then(segments => {
		segments.map(s => {
			s.route = polyline.fromGeoJSON(s.route);
		})
		res.json(segments)
	})

});


// GET list of segments by location (lat lng) + range in KM
app.get("/segment_search", (req, res, next) => {
	// find all relevant segments, return IDs, Names and geometries
	// so they can be rendered on the front end
	if (typeof req.query.lat != 'undefined') {
		var lat = req.query.lat
		var lng = req.query.lng
		var geom = 'POINT(' + lng + ' ' + lat + ')'
	} else if (typeof req.query.geom != 'undefined') {
		var geom = wkt.stringify(polyline.toGeoJSON(req.query.geom));
	}
	var range = req.query.range;
	db.Segment.findAll({
	      where: db.sequelize.where(
		      db.sequelize.fn(
			      'ST_DWithin',
			      db.sequelize.col('route'),
			      geom,
			      range,
			      true
		      ),
		      true
	      )
	}).then(segments => {
		segments.map(s => {
			s.route = polyline.fromGeoJSON(s.route);
		})
		res.json(segments)
	})

});

// TODO: update/delete on segment

app.listen(3000, () => {
	console.log("Server running on port 3000");
});


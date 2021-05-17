var db = require('./models/index.js');
var polyline = require('@mapbox/polyline');
var express = require("express");
var app = express();
app.use(express.json());

// GET single segment by its ID
app.get("/segment", (req, res, next) => {
	// look up the segment by its id, return all info
	var segment_id = req.id
	var segment = db.Segment.findByPk(segment_id).then(segment => {
		if (segment instanceof db.Segment) {
			segment.route = polyline.fromGeoJSON(s.route);
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
// in the future also take in linstring rather than just point
app.get("/segment_search", (req, res, next) => {
	// find all relevant segments, return IDs, Names and geometries
	// so they can be rendered on the front end
	res.json(["Tony","Lisa","Michael","Ginger","Food"]);
});

// TODO: update/delete on segment

app.listen(3000, () => {
	console.log("Server running on port 3000");
});


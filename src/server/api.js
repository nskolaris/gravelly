var db = require('./models/index.js');
var wkt = require('wkt');
var polyline = require('@mapbox/polyline');
var express = require("express");
var cors = require('cors');
var multer = require('multer');
var app = express();
app.use(express.json());
app.use(cors())

// TODO: change this to s3/cloudwatch
// this code is not meant to end up in productio
var storage = multer.diskStorage({
	destination: function(req, file, callback) {
		callback(null, '../assets/images/');
	},
	filename: function (req, file, callback) {
		var mimetype = file.mimetype.split("/")
		var ext = mimetype[mimetype.length-1]
		callback(null, Date.now() + '.' + ext);
	}
});
var upload = multer({ storage: storage });

// GET single segment by its ID
app.get("/segment", (req, res, next) => {
	// look up the segment by its id, return all info
	var segment_id = req.query.id
	var segment = db.Segment.findByPk(parseInt(segment_id), {
		include: {
			model: db.Picture
		}
	}).then(segment => {
		if (segment instanceof db.Segment) {
			segment.route = polyline.fromGeoJSON(segment.route);
			res.json(segment)
		} else {
			res.json({})
		}
	});

});

app.delete("/segment", (req, res, next) => {
	// look up the segment by its id, return all info
	var segment_id = req.query.id
	var segment = db.Segment.findByPk(parseInt(segment_id)).then(segment => {
		if (segment instanceof db.Segment) {
			segment.is_removed = true
			segment.save()
			res.json({'success': true})
		} else {
			res.json({'success': false})
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
		route: route,
		chunkyness: req.body.chunkyness,
		waytype: req.body.waytype
	}
	db.Segment.create(obj)
	res.send('created');
})

app.put('/segment', (req, res) => {
	var segment_id = req.body.segment_id
	var segment = db.Segment.findByPk(parseInt(segment_id)).then(segment => {
		if (segment instanceof db.Segment) {
			if (typeof req.body.name != 'undefined') {
				segment.name = req.body.name
			}
			if (typeof req.body.description != 'undefined') {
				segment.description = req.body.description
			}
			if (typeof req.body.strava_link != 'undefined') {
				segment.strava_link = req.body.strava_link
			}
			if (typeof req.body.waytype != 'undefined') {
				segment.waytype = req.body.waytype
			}
			if (typeof req.body.chunkyness != 'undefined') {
				segment.chunkyness = req.body.chunkyness
			}
			if (typeof req.body.route != 'undefined') {
				if (typeof req.body.route == 'string') {
					segment.route = polyline.toGeoJSON(req.body.route);
				}
			}
			segment.save()
			res.json({'success': true})
		} else {
			res.json({'success': false})
		}
	});
})

app.get("/segments", (req, res, next) => {
	// look up the segment by its id, return all info
	db.Segment.findAll({
		include: {
			model: db.Picture
		}
	}).then(segments => {
		segments.map(s => {
			s.route = polyline.fromGeoJSON(s.route);
		})
		res.json(segments)
	})

});


app.post("/flag_segment", (req, res, next) => {
	// look up the segment by its id, return all info
	// TODO: rework this when users are a thing
	var segment_id = req.body.segment_id
	var segment = db.Segment.findByPk(parseInt(segment_id)).then(segment => {
		if (segment instanceof db.Segment) {
			if (segment.flag_count == null) {
				segment.flag_count = 0
			} else {
				segment.flag_count += 1
			}
			segment.save()
			res.json({'success': true})
		} else {
			res.json({'success': false})
		}
	});

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
	      ),
	      include: {
	              model: db.Picture
	      }
	}).then(segments => {
		segments.map(s => {
			s.route = polyline.fromGeoJSON(s.route);
		})
		res.json(segments)
	})

});

// pictures

app.get("/picture", (req, res, next) => {
	// look up the segment by its id, return all info
	var picture_id = req.query.id
	var picture = db.Picture.findByPk(parseInt(picture_id)).then(segment => {
		if (segment instanceof db.Picture) {
			res.json(segment)
		} else {
			res.json({})
		}
	});

});


app.post('/picture', upload.single('file'), (req, res) => {
	// TODO: some image handling needs to happen here
	if (!req.file) {
		console.log("No file received");
		return res.send({
			success: false
		});
	} else {
		console.log(req.file)
		var path = 'assets/images/' + req.file.filename
		var name = 'test1'
		obj = {
			path: path,
			name: req.body.name,
			description: req.body.description,
			lat: parseFloat(req.body.lat),
			lng: parseFloat(req.body.lng),
			SegmentId: parseInt(req.body.SegmentId),
		}
		console.log(obj)
		db.Picture.create(obj)
		res.send('created');
	}
})

app.get("/pictures", (req, res, next) => {
	db.Picture.findAll().then(pictures => {
		res.json(pictures)
	})

});

// ratings
//
app.get("/ratings", (req, res, next) => {
	// look up the segment by its id, return all info
	var segment_id = req.query.segment_id
	if (typeof segment_id == 'undefined') {
		// return all ratings
		// TODO: consider removing this functionality in the future
		db.Rating.findAll().then(ratings => {
			res.send(ratings)
		})
	} else {
		// return relevant ratings
		db.Rating.findAll({
			where: {SegmentId: segment_id}
		}).then(ratings => {
			res.send(ratings)
		})
	}
});


app.post('/rating', (req, res) => {
	// make a new rating
	obj = {
		SegmentId: req.body.segment_id,
		rating: req.body.rating, // should be between 0 and 5
		comment: req.body.comment
	}
	db.Rating.create(obj)
	res.send('created');
})

// misc stuff



// TODO: update/delete on segment

app.listen(3000, () => {
	console.log("Server running on port 3000");
});


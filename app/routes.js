var Bar = require('./models/bar');  // load the Bar mongoose model

module.exports = function(app) {


	// api ---------------------------------------------------------------------
	// yelp search by latitude and longitude
	app.get('/api/yelp/:lat/:lon', function(req, res) {
		// See http://www.yelp.com/developers/documentation/v2/search_api
		yelp.search({ term: 'bar', ll: req.params.lat + "," + req.params.lon})
		.then(function (data) {
			res.json(data);
		})
		.catch(function (err) {
			res.send(err);
		});
	});

	// yelp search by location
	app.get('/api/yelp/:location', function(req, res) {
		// See http://www.yelp.com/developers/documentation/v2/search_api
		yelp.search({ term: 'bar', location: req.params.location })
		.then(function (data) {
			res.json(data);
		})
		.catch(function (err) {
			res.send(err);
		});
	});

	// get all bars
	app.get('/api/bars', function(req, res) {
		// use mongoose to get all polls from the db
		Bar.find(function(err, bars) {
			// if err, send it
			if (err) {
				res.send(err);
			} else {
				res.json(bars);
			}
		});
	});

	// check if bar exist in DB and add one attendant else create bar entry and add the yelp_id of the bar to the user going
	app.post('/api/bar', function(req, res) {
		Bar.findOne({ 'yelp_id' :  req.body.yelp_id }, function(err, bar) {
			if (err) {
				console.log("error: " + err);
			} else {
				// if bar == null then create entry in DB
				if (bar == null) {
					Bar.create({
						yelp_id : req.body.yelp_id,
						attendants : 1,
					}, function(err, bar) {
						if (err) {
							res.send(err);
						}
						res.sendStatus(200);
					});
				} else {
					// update bar entry in DB with +1 or -1 attendants depending on the action
					if (req.body.action == "add") {
						bar.attendants += 1;
					}
					else if (req.body.action == "remove") {
						bar.attendants -= 1;
					}
					bar.save(function (err) {
						if (err) {
							res.send(err);
						} else {
							res.sendStatus(200);
						}
					});
				}
			}
		});
	});
};

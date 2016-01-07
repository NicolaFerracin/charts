var Bar = require('./models/bar');  // load the Bar mongoose model
var User = require('./models/user');  // load the User mongoose model for passport.js authentication

module.exports = function(app, passport) {



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

	// process the login form
	// Express Route with passport authentication and custom callback
	app.post('/api/login', function(req, res, next) {
		passport.authenticate('local-login', function(err, user, info) {
			if (err) {
				return next(err);
			}
			if (user === false) {
				res.status(401).send(req.flash('loginMessage'));
			} else {
				req.login(user, function(err) {
					if (err) {
						res.status(500).send("There has been an error");
					} else {
						console.log(user)
						res.status(200).send("success!");
					}
				});
			}
		})(req, res, next);
	});

	// process the signup form
	// Express Route with passport authentication and custom callback
	app.post('/api/signup', function(req, res, next) {
		passport.authenticate('local-signup', function(err, user, info) {
			if (err) {
				return next(err);
			}
			if (user === false) {
				res.status(401).send(req.flash('signupMessage'));
			} else {
				res.status(200).send("success!");
			}
		})(req, res, next);
	});

	app.get('/loggedin', function(req, res) {
		if (req.isAuthenticated()) {
			var user = req.user;
			// hide sensible information
			user.local.password = "";
			res.json(req.user);
		}
		else {
			res.json(undefined);
		}
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	// update a user entry with new bar
	app.post('/api/user/:id', function(req, res) {
		User.findOne({ '_id' :  req.params.id }, function(err, user) {
			if (err) {
				res.send(err);
			} else {
				user.bars = req.body;
				user.save(function(err) {
					if (err) {
						return next(err)
					} else {
						req.login(user, function(err) {
							if (err) {
								return next(err)
							} else {
								res.sendStatus(200)
							}
						})
					}
				});
			}
		});
	});
};

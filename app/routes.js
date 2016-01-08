var Stock = require('./models/stock');  // load the Stock mongoose model

module.exports = function(app, io) {

	// get all stocks under visualization
	app.get('/api/stocks', function(req, res) {
		// use mongoose to get all stocks from the db
		Stock.find(function(err, stocks) {
			// if err, send it
			if (err) {
				res.send(err);
			} else {
				res.json(stocks);
			}
		});
	});

	// create stock in DB
	app.post('/api/stock', function(req, res) {
		Stock.create({
			name : req.body.name,
			color : req.body.color
		}, function(err, stock) {
			if (err) {
				res.send(err);
			}
			io.on('connection', function(socket){
			    socket.on('message', function(data){
						console.log(socket);
						return;
			    });
			});
			var socketio = req.app.get('socketio'); // tacke out socket instance from the app container
			socketio.emit('stock.added', {
				name : req.body.name }); // emit an event for all connected clients
			res.sendStatus(200);
		});
	});

	// delete stock from DB
	app.delete('/api/stock/:name', function(req, res) {
		Stock.remove({
			name : req.params.name
		},
		function(err, stock) {
			if (err) {
				res.send(err);
			}
			var socketio = req.app.get('socketio'); // tacke out socket instance from the app container
			socketio.emit('stock.removed', {
				name : req.params.name }); // emit an event for all connected clients
			res.sendStatus(200);
		});
	});

	// use express routing for pages refresh
	app.get('/', function(req, res, next) {
		// Just send the index.html for other files to support HTML5Mode
		res.sendFile('/public/index.html', { root: __dirname });
	});
};

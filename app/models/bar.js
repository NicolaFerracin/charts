// thing mongoose model populated with random stuff

var mongoose = require('mongoose');


module.exports = mongoose.model('Bar', {
  yelp_id : String,
  attendants : Number
});

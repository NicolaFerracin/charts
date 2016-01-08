// thing mongoose model populated with random stuff
var mongoose = require('mongoose');

module.exports = mongoose.model('Stock', {
  name : String,
  color : String
});

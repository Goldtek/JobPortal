var mongoose = require('mongoose');
var schema = mongoose.Schema;

var countrySchema = new schema({
    name:{type:String,required:true},
    sortname:String,
    _id:Number,
    phonecode:String
});

module.exports = mongoose.model('country',countrySchema);



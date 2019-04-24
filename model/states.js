var mongoose = require('mongoose');
var schema = mongoose.Schema;

var stateSchema = new schema({
    name:{type:String,required:true},
    _id:Number,
    country_id:{type:Number,ref:'countries'}
});

module.exports = mongoose.model('state',stateSchema);



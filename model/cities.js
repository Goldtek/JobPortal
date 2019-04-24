var mongoose = require('mongoose');
var schema = mongoose.Schema;

var citySchema = new schema({
    name:{type:String,required:true},
    _id:Number,
    state_id:{type:schema.Types.Number,ref:'state'}
});

module.exports = mongoose.model('city',citySchema);



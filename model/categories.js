var mongoose = require('mongoose');
var schema = mongoose.Schema;

var categorySchema = new schema({
    name:{type:String,required:true},
    path:{type:String,default:''},
    created_at:{type:Date,default:Date.now}
});

module.exports = mongoose.model('category',categorySchema);



var mongoose = require('mongoose');
var schema = mongoose.Schema;

var albumSchema = new schema({
    name:{type:String,required:true},
    description:String,
    userid:{type:schema.Types.ObjectId,ref:'user'},
    path:String,
    date:{type:Date,default:Date.now}
});

module.exports = mongoose.model('album',albumSchema);



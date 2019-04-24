var mongoose = require('mongoose');
var schema = mongoose.Schema;

var imagesSchema = new schema({
    name:{type:String,required:true,index:true},
    albumname:{type:String,required:true,index:true},
    userid:{type:schema.Types.ObjectId,ref:'user'},
    path:{type:String,required:true},
    date:{type:Date,default:Date.now}
});

module.exports = mongoose.model('image',imagesSchema);



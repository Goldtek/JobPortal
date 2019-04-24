var mongoose = require('mongoose');
var schema = mongoose.Schema;

var postSchema = new schema({
    name:{type:String,required:true},
    userid:{type:schema.Types.ObjectId,ref:'user'},
    posterid:{type:schema.Types.ObjectId,ref:'user'},
    message:{type:String,required:true},
    img:{type:String,ref:'user'},
    date:{type:Date,default:Date.now}
    
    
});

module.exports = mongoose.model('post',postSchema);



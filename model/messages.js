var mongoose = require('mongoose');
var schema = mongoose.Schema;

var messageSchema = new schema({
    toid:{type:schema.Types.ObjectId,ref:'user'},
    fromid:{type:schema.Types.ObjectId,ref:'user'},
    fromuser:String,
    message:{type:String,required:true},
    read:{type:String,required:true},
    date:{type:Date,default:Date.now}
});

module.exports = mongoose.model('message',messageSchema);



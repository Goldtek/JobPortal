var mongoose = require('mongoose');
var schema = mongoose.Schema;

var contactSchema = new schema({
    recid:{type:schema.Types.ObjectId,index:true,ref:'user'},
    status:{type:Number,default:0,index:true},
    senderid:{type:schema.Types.ObjectId,index:true,ref:'user'},
    date:{type:Date,default:Date.now}    
});

module.exports = mongoose.model('contact',contactSchema);



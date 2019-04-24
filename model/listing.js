var mongoose = require('mongoose');
var schema = mongoose.Schema;

var listingSchema = new schema({
    title:{type:String,required:true},
    description:{type:String,required:true},
    landmark:String,
    category:{type:schema.Types.ObjectId,ref:'category'},
    user_id:{type:schema.Types.ObjectId,ref:'user'},
    city:{type:Number,ref:'city'},
    state:{type:Number,ref:'state'},
    country: { type: Number, ref: 'country' },
    least:Number,
    highest:Number,
    path:String,
    created_at:{type:Date,default:Date.now}
});

module.exports = mongoose.model('listing',listingSchema);



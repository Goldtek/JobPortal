var mongoose = require('mongoose'),
schema = mongoose.Schema;

var vendorSchema = new schema({
    fname:{type:String,index:true},
    sname:{type:String,index:true},
    company:{type:String,index:true},
    email:{type:String,required:true,index:{unique:true}},
    phone:String,
    address:{type:String,index:true},
    city:{type:String,index:true},
    state:{type:String,index:true},
    country:{type:String,required:true,index:true},
    usertype:{type:String,required:true,index:true},
    pass: {type:String, required:true},
    history:String,
    website:String,
    twitter:String,
    facebook:String,
    instagram:String,
    googleplus:String,
    refers:{type:String,index:true,default:0},
    profileImg:{type:String,default:"../images/new.jpg"},
    timeline:String,
    service:[{name:String}],
    Regdate:{type:Date,default:Date.now},
    event:[String],
    ip:String,
    status:{type:Boolean,default:false},
    active:{type:String,default:0},
});



vendorSchema.index({ 
    fname: 'text',
    sname:'text',
    address:'text',
    city:'text',
    state:'text',
    country:'text',
    usertype:'text',
    service:'text'
});

module.exports = mongoose.model('vendor',vendorSchema);



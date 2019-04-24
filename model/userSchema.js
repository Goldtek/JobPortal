    var mongoose = require('mongoose'),
        schema = mongoose.Schema;

        var userSchema = new schema({
            fname:{type:String,index:true},
            sname:{type:String,index:true},
            email:{type:String,required:true,index:{unique:true}},
            phone:String,
            address:{type:String,index:true},
            city:{type:schema.Types.String,ref:'city',index:true},
            state:{type:schema.Types.String,ref:'state',required:true,index:true},
            country:{type:schema.Types.Number,ref:'country',required:true,index:true},
            usertype:{type:String,required:true,index:true},
            pass: {type:String, required:true},
            history:String,
            website:String,
            twitter:String,
            facebook:String,
            instagram:String,
            googleplus:String,
            refers:{type:String,index:true,default:0},
            contacts:[{user:{type:schema.Types.ObjectId,ref:'user'}}],
            refers:[{id:{type:String,index:true,default:0}},{user_id:{type:schema.Types.ObjectId,ref:'user'}},{comment:{type:String}}],//who did the referal and number,also refers comment
            active:{type:Number,default:0},
            profileImg:{type:String,default:"./assets/images/new.jpg"},
            timeline:String,
            Regdate:{type:Date,default:Date.now},
            vendors:[{user:{type:schema.Types.ObjectId,ref:'user'}}],
            ip:String,
            status:{type:Boolean,default:false}
        });

userSchema.index({ fname: 'text',sname:'text',address:'text',city:'text',
            state:'text',country:'text',usertype:'text'});

module.exports = mongoose.model('user',userSchema);



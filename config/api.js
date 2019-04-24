const User = require('../model/userSchema'),
    Vendor = require('../model/vendor'),
    Album = require('../model/album'),
    Country = require('../model/countries'),
    State = require('../model/states'),
    City = require('../model/cities'),
    Image = require('../model/images'),
    Contact = require('../model/contact'),
    Message = require('../model/messages'),
    Category = require('../model/categories'),
    Listing = require('../model/listing'),
    Post = require('../model/post'),
    config = require('./config'),
    webToken = require('jsonwebtoken'),
    fs = require('fs'),
    key = config.secretkey,
    multer = require('multer'),
    bycrpt = require('bcryptjs'),
    async = require("async"),
    usernames = {};


function createToken(user){

  const token =  webToken.sign({
      name:user.sname+" "+user.fname,
      img:user.profileImg,
       id:user._id
   },key,{expiresIn:1209600});
    return token;
}

function clean(value,res,req){
    if(typeof value!=='string'){
        value='';
        return;
    }
    value = req.sanitize(value);
    return value;
}

module.exports = (app,express,sanitizer,io,con)=>{

    api = express.Router();

    //get countries
    api.get('/countries',(req,res)=>{
        Country.find({ _id: 160 }, function (err, countries) {
            if (err) {
                res.status(401).send({ success: false, message: err });
            }
            return res.json({ success: true, countries: countries});
        }); 

    });

    //get states
    api.get('/states', (req, res) => {
        State.find({ country_id: 160 }, function (err, states) {
            if (err) {
                res.status(401).send({ success: false, message: err });
            }
            return res.json({ success: true, states: states});
        });

    });

    //get cities
    api.get('/cities', (req, res) => {
        City.find(function (err, cities) {
            if (err) {
                res.status(401).send({ success: false, message: err });
            }
            return res.json({ success: true, cities: cities });
        });
    });

    api.get('/categories', (req, res) => {
        Category.find((err, categories) => {
            if (err) {
                return res.json({ success: false, message: "Error while getting categories" });
            }

            return res.json({ success: true, categories: categories });
        })
    });

    //user login
    api.post('/login',(req,res)=>{
        const email=clean(req.body.email,res,req),
        password=clean(req.body.password,res,req);
    
        User.findOne({email:email}).
        populate({ path: 'country'})
        . populate({ path: 'state'})
        .populate({ path: 'city'})
        .populate({ path: 'contacts.user',select:'fname sname email state city country_id'})
        .populate({ path: 'vendor.user',select:'fname sname email state city country_id'})
        .exec(function(err,user){
            if(err){ 
               res.json({message:err});
            }
            //create token
            if(!user){
                res.status(404).send({ message:'Invalid Username/Password'});
            }else{
                if(bycrpt.compareSync(password,user.pass)){
                   
                    const token = createToken(user);
                                            
                    userObj = {
                        _id:user._id,
                        sname:user.sname,
                        fname :user.fname,
                        country:user.country,
                        history:user.history,
                        usertype:user.usertype,
                        phone:user.phone,
                        state:user.state,
                        city:user.city,
                        website:user.website,
                        refers:user.refers,
                        img:user.profileImg,
                        regdate:user.Regdate,
                        status:user.status,
                   };
                    res.json({
                        success:true,
                        message:'successfully logged In',
                        token:token,
                        user:userObj
                    });
     
                    //update login status to true
                    User.findOneAndUpdate({email:email}, { $set:{ status:true}},function(err,user){
                            if(err){
                                return res.json({success:false,message:"couldn't Update users status. Please try again"});
                            }
                    });
                }else{

                    res.json({
                        message:'Invalid Username/Password,Please try again',
                        success:false
                    });
                }
            }
        });

    });

    //signup a user
    api.post('/user/register',(req,res)=>{
        const fname=clean(req.body.fname,res,req),
            sname=clean(req.body.sname,res,req),
            state=clean(req.body.state,res,req),
            phone=clean(req.body.phone,res,req),
            email=clean(req.body.email,res,req),
            city = clean(req.body.city,res,req),
            country=clean(req.body.country,res,req),
            usertype=clean(req.body.usertype,res,req),
            pass=clean(req.body.password,res,req);

        //saving the record
        if(fname!="" && sname!="" && phone!="" && state!="" && email!="" && country!="" && usertype!="" && pass!="" && city!=""){
            const hash = bycrpt.hashSync(pass,bycrpt.genSaltSync(10));

                const user = new User({
                        fname:fname,
                        sname:sname,
                        email:email,
                        country:country,
                        state:state,
                        city:city,
                        phone:phone,
                        usertype:usertype,
                        pass:hash
                });
                user.save(function(err){
                    if(err){
                        return res.json({success:false,message:err.code});
                        // return res.json({success:false,message:"The Email already exist please try again"});
                    }else{
                        return res.json({success:true,message:"your account has been successfully created"});
                    }
                });

        }else{
            return res.json({success:false,message:"All fields required"});
        }
    });

   
    //middlewre to confirm login
    api.use((req,res,next)=>{
        const token = req.body.token || req.params.token || req.headers['x-access-token'];
       if(token){
         //verify the token
           webToken.verify(token,key,function(err,decoded){
               if(err){
                   return res.status(403).send({success:false,message:"invalid token"});
               }

               req.decoded = decoded;
               next();

           });
       }else{
            res.status(403).send({success:false,message:"unAuthorised request attempt"});
            return;
       }
    });


    api.get('/me',(req,res)=>{
       return res.json(req.decoded);
    });

    //retrieve contacts to be sent to the frontend
    api.get('/contacts/:id',(req,res)=>{
      
        //also add and operator for approved==true
        const id = clean(req.params.id,res,req),
            users=[];

        //getting buddies i added and confirmed
        Contact.find({recid:id,status:1}).select('senderid').exec(function(err,user){
           async.each(user,function(u,callback){
               users.push(u.senderid); //pass this to an external array
           });
        });

        //getting buddies that added me and i confirmed
        Contact.find({senderid:id,status:1}).select('recid').exec(function(err,user){
            async.each(user,function(u,callback){
                users.push(u.recid);//pass this to an external array
            });

            User.find({_id:{$in:users}},'fname sname profileImg _id country state',function(err, buddies){
                if(err){
                    res.json(err);
                }
                //sending out buddies details
                return res.json(buddies);

            });


        });

    });


    //checking if buddy/friend or not
    api.post('/contact',(req,res)=>{
      //also add and operator for approved==true
        const id = clean(req.params.id,res,req),
            checkId = clean(req.params.checkId,res,req),
            count = 0,
            users=[];

        //getting buddies i added and confirmed
        Contact.find({recid:id,status:1}).select('senderid').exec(function(err,user){
            async.each(user,function(u,callback){
               users.push(u.senderid); //pass this to an external array
            });
        });

        //getting buddies that added me and i confirmed
        Contact.find({senderid:id,status:1}).select('recid').exec(function(err,user){
            async.each(user,function(u,callback){
               users.push(u.recid);//pass this to an external array
           });

            User.find({_id:{$in:users}},'fname sname profileImg _id country state',function(err, buddies){
                if(err){
                    res.json(err);
                }

                //sending out buddies details
                //using for statement to loop through buddies
               for(i=0;i<=buddies;i++){
                    // if any matches the id of the user in the profile been viewed then increase count by 1
                    if(checkId===buddies[i]){
                        count = count + 1;
                    }
                }
                        //checking if any id matched or not from count
                if(count>0){
                    return res.json({isBuddy:true});
                }else{
                    res.json({isBuddy:false});
                }

            });


        });

    });

   // respond to invitation request
    api.post('/resRequest',(req,res)=>{
        const answer = clean(req.body.answer,res,req),
            senderid = clean(req.body.senderid,res,req),
            reqid = clean(req.body.reqid,res,req),
            id = clean(req.body.recid,res,req);


        if(answer==="accept"){
            //approve the friendship apply request id
            Contact.findOneAndUpdate({
                $and:[{recid:id},{senderid:senderid}],_id:reqid}, { $set: { status: 1 }},function(err,foundrequest){

                if(err){
                    return res.json({success:false,message:"Please try again"});
                }

                return res.json("succesful addition of contact");
            });
        }else if(answer==='reject'){
            //deny friendship
            Contact.findOneAndRemove({recid:id,senderid:senderid},function(err){
                if(err) {
                    return res.json(err);
                }
                return res.json({message:"Invitation request Denied"});

            });

        }

    });

    //send request/invitation
    api.post('/request',(req,res)=>{
        const userid= clean(req.body.userid,res,req),
            recid= clean(req.body.recid,res,req),
            
            contact = new Contact({
                recid:recid,
                senderid:userid
            });

        contact.save(function(err){
              if(err){
                    return res.json({success:false,message:err});
              }
              res.json({success:true,message:"Invitation successfully sent"});
        });
    });

    //refer a vendor to a user
    api.post('/refer',(req,res)=>{

    });

    //change profile image
    api.post('/changeImg/:id',function(req,res){
        const id= clean(req.params.id,res,req);

         User.findOne({_id:id},function(err,user){
            if(err){
                return res.status(500).send();
            }
            if(!user){
              res.redirectTo('/');
            }else{
               if(req.body.profileimg){
                   //update profile image

                   //delete current profile img
                   //unlink(user. profileImg);
                   //useri +

                   //upload new profile img
                   //configuring multer settings

                    //multers disk storage settings for profile images
                    const profile = multer.diskStorage({
                        destination: function (req, file, cb) {
                            cb(null, './public/profile');
                        },
                        filename: function (req, file, cb) {
                            cb(null, user._id + file.fieldname + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
                        }
                    });

                   //creating a new instance of and passing in the storage settings
                   const  upload = multer({ //multer settings
                            storage: profile
                        }).single('file');
                   
                    //perform the upload
                    upload(req,res,function(err){
                        if(err){
                            res.json({error_code:1,err_desc:err});
                            return;
                        }
                        res.json({error_code:0,err_desc:null});
                    });



               }else if(req.body.timeline){
                   //update timeline
               }


            }

        });
    });

    //updated profile fields
    api.put('/update',function(req,res){
        const id= clean(req.body._id,res,req),
            address= clean(req.body.address,res,req),
            history= clean(req.body.history,res,req),
            fname= clean(req.body.fname,res,req),
            sname= clean(req.body.sname,res,req),
            phone= clean(req.body.phone,res,req),
            website= clean(req.body.website,res,req);
            googleplus= clean(req.body.googleplus,res,req);
            twitter= clean(req.body.twitter,res,req);
            instagram= clean(req.body.instagram,res,req);
            facebook= clean(req.body.facebook,res,req);


       
        if(req.body.address){
            User.findOneAndUpdate({_id:id}, { $set: { address:address  }},function(err,user){

                if(err){
                    return res.json({success:false,message:"Please try again"});
                }

            });
        }

        if(req.body.history){
            User.findOneAndUpdate({_id:id}, { $set: { history:history}},function(err,user){
                if(err){
                    return res.json({success:false,message:"Please try again"});
                }
            });
        }

        if(req.body.fname){
            User.findOneAndUpdate({_id:id}, { $set: { fname:fname  }},function(err,user){
                if(err){
                    return res.json({success:false,message:"Please try again"});
                }
            });
        }

        if(req.body.sname){
            User.findOneAndUpdate({_id:id}, { $set: { sname:sname  }},function(err,user){
                if(err){
                    return res.json({success:false,message:"Please try again"});
                }
            });
        }

        if(req.body.phone){
            User.findOneAndUpdate({_id:id}, { $set: { phone:phone  }},function(err,user){
                if(err){
                    return res.json({success:false,message:"Please try again"});
                }
            });
        }

        if(req.body.website){
            User.findOneAndUpdate({_id:id}, { $set: { website:website  }},function(err,user){
                if(err){
                    return res.json({success:false,message:"Please try again"});
                }
            });
        }

        if(req.body.facebook){
            User.findOneAndUpdate({_id:id}, { $set: { facebook:facebook  }},function(err,user){
                if(err){
                    return res.json({success:false,message:"Please try again"});
                }
            });
        }

        if(req.body.googleplus){
            User.findOneAndUpdate({_id:id}, { $set: { googleplus:googleplus  }},function(err,user){
                if(err){
                    return res.json({success:false,message:"Please try again"});
                }
            });
        }

        if(req.body.instagram){
            User.findOneAndUpdate({_id:id}, { $set: { instagram:instagram  }},function(err,user){
                if(err){
                    return res.json({success:false,message:"Please try again"});
                }
            });
        }

        if(req.body.twitter){
            User.findOneAndUpdate({_id:id}, { $set: { twitter:twitter  }},function(err,user){
                if(err){
                    return res.json({success:false,message:"Please try again"});
                }
            });
        }

        return res.json({success:true,message:"Update Successful"});


    });

    //create an album
    api.post('/createAlbum/:id',(req,res)=>{
        const id= clean(req.params.id,res,req),
            name= clean(req.body.name,res,req),
            des= clean(req.body.description,res,req);

        // * * * * upload album image and get the path
        //configuring multer settings
        User.findOne({_id:id},function(err,user){

            const albm = multer.diskStorage({ //multers disk storage settings for profile images
                    destination: function (req, file, cb) {
                        cb(null, './album/')
                    },
                    filename: function (req, file, cb) {
                        const datetimestamp = Date.now();
                        cb(null, user._id + name + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
                    }
                });
                   //creating a new instance of and passing in the storage settings
                const upload = multer({ //multer settings
                            storage: albm
                    }).single('file');

                return res.json({albm:albm.filename});
                
                //save record
                const album = new Album({
                            name:albm.filename,
                            description:des,
                            userid:id,
                            path:albm.cb,
                    });

            album.save(function(err){
                if(err){
                    res.status(500).send({success:false,message:"Album creation was not successful"});
                    //delete the album image
                    return;
                }
                res.json({success:true,message:"album successfully created"})
            });
        });


    });

       //delete an album
    api.delete('/deleteAlbum/:album_id',function(req,res){
        const id = clean(req.params.album_id,res,req);

        //delete from the albums folder

        //delete from the album collection
        Album.findOneAndRemove({_id:id},function(err){
            if(err){
                return res.json({success:false,message:"The album deletion was unsuccessful.Please Try again"});
            }
            return res.json({success:true,message:"The album was successful deleted."});
        });
    });

    //upload an image into an album
    api.post('/upload/:album',function(req,res){
        const storage =   multer.diskStorage({
                destination: function (req, file, callback) {
                    callback(null, './public/album');
                },
                filename: function (req, file, callback) {
                    callback(null,  Date.now()+file.originalname);
                    console.log(file.originalname);
                    //   return console.log(req.body.data);
                    //here i log it to the db , album name  id and userid

                }
            });

        const upload = multer({ storage : storage }).array('file',10);
            
            upload(req,res,function(err) {
                //  console.log(req.body);
                //console.log(req.files.filename);
                if(err) {
                    // return res.end("Error uploading file.");
                    return console.log(err);
                }
                console.log(req.body);
            });

        //   const albumId = clean(req.body.albumid,res,req),
        //  userId = clean(req.body.userid,res,req);
    });


     //delete an image in an album
    api.delete('/delete/:userid/:albumid/:imgid',(req,res)=>{
        const albumId = clean(req.params.albumid,res,req),
            userId = clean(req.params.userid,res,req),
            imgId = clean(req.params.imgid,res,req);
        
            //confirm the user is loggedIn

        //delete from the album collection
        Album.findOneAndRemove({_id:img},function(err){
            if(err){
                return res.json({success:false,message:"The album deletion was unsuccessful.Please Try again"});
            }
            //delete the folder of the album also
            return res.json({success:true,message:"The album was successful deleted."});
        });

    });

    //load each persons profile page
    api.get('/profile/:id',function(req,res){
        const id = clean(req.params.id,res,req);
     
        //projection of what you want retrieved
        User.findOne({_id:id},'-pass')
            .populate({ path: 'country'})
            .populate({ path: 'state'})
            .populate({ path: 'city'})
            .populate({ path: 'contacts.user',select:'fname sname email state city country_id'})
            .populate({ path: 'vendor.user',select:'fname sname email state city country_id'})
            .exec(function(err,user){
                if(err){
                    // res.json(err);
                    return res.status(401).send({message:"invalid user"});
                }
            
                response = {
                            userid:user._id,
                            name:user.sname+" "+user.fname,
                            country:user.country,
                            history:user.history,
                            usertype:user.usertype,
                            phone:user.phone,
                            state:user.state,
                            facebook:user.facebook,
                            instagram:user.instagram,
                            twitter:user.twitter,
                            refers:user.refers,
                            img:user.profileImg,
                            regdate:user.Regdate,
                            status:user.status,
                            //event and services
                         };
                return res.json(user);
        });
    });

    //submit post
    api.post('/post',(req,res)=>{
        const  name = clean(req.body.name,res,req),
            id = clean(req.body.id,res,req),
            pid = clean(req.body.pid,res,req),
            message = clean(req.body.message,res,req);

        const post = new Post({
            name:name,
            userid:id,
            posterid:pid,
            message:message
        });
        
        post.save(function(err){

            if(err){
                return res.json({success:false,message:err.code});
                //   return res.json({success:false,message:"The Email already exist please try again"});
            }

            User.find({_id:pid},'profileImg -_id',function(err,image){
                if(err){
                    return res.json(err);
                }
                const img=image[0].profileImg;
                    req.body.img=img;
                return res.json({success:true,message:req.body});
            });



        });
    });

    //retrieve post
    api.post('/posts',(req,res)=>{
        const id =clean(req.body.id,res,req);

        async.waterfall([
            function getPost(callback){
                Post.find({userid:id},'userid name message _id date posterid').sort('-_id').exec(function(err,post){
                    if(err){
                        return res.json(err);
                    }
                    callback(null,post);
                });
            }, //first function ends here
            function getPosterImage(post,callback){
                posts=[];
                async.each(post,function(p,funky){
                    User.find({_id:p.posterid},'profileImg -_id',function(err,image){
                        if(err){
                            return res.json(err);
                        }
                        const img=image[0].profileImg;
                        p.img=img;
                        posts.push(p);
                        funky();
                    });
                },function(err){
                    callback(null,posts);
                });
            } //end of second query function
        ],function(err,posts){
            if(err){
              return  res.json(err)
            }
            return res.json(posts);
        });
    });

    //api for search
    api.post('/search',(req,res)=>{
        const search = clean(req.body.q,res,req),
            country_id = clean(req.body.country_id,res,req),
            city_id = clean(req.body.city_id,res,req),
            state_id = clean(req.body.state_id,res,req),
            category_id = clean(req.body.category_id,res,req),
            countryArray = [],
            stateArray = [],
            cityArray = [],
            categoryArray = [];
    
             Country.find({ 'name': new RegExp(search, 'i') }).select('_id').exec((err,ids)=>{ 
                        if(err){
                            return res.json(err);
                        } 
                                //store the id removing the and keping the value 
                    async.each(ids, function (id, callback) {
                        countryArray.push(parseInt(id._id)); //pass this to an external array
                    });

                    Listing.find({ country : { $in: countryArray } })
                        .populate({ path: 'country', select: 'name' }) //search for them one after the other and plug then in as an obj
                        .populate({ path: 'state', select: 'name' })
                        .populate({ path: 'city', select: 'name' })
                        .populate({ path: 'category', select: 'name' })
                        .exec(function (err, listings) {
                            if (err) {
                                return res.json(err);
                            }
                    //    return res.json(listings);
                    });
                            
                });
           
                State.find({ 'name': new RegExp(search, 'i') }).select('_id').exec((err,ids)=>{ 
                        if(err){
                            return res.json(err);
                        } 
                                //store the id removing the and keping the value 
                    async.each(ids, function (id, callback) {
                        stateArray.push(parseInt(id._id)); //pass this to an external array
                    });

                    Listing.find({ state : { $in: stateArray } })
                        .populate({ path: 'country', select: 'name' }) //search for them one after the other and plug then in as an obj
                        .populate({ path: 'state', select: 'name' })
                        .populate({ path: 'city', select: 'name' })
                        .populate({ path: 'category', select: 'name' })
                        .exec(function (err, listings) {
                            if (err) {
                                return res.json(err);
                            }
                     //   return res.json(listings);
                    });
                            
                });
    
             City.find({ 'name': new RegExp(search, 'i') }).select('_id').exec((err,ids)=>{ 
                        if(err){
                            return res.json(err);
                        } 
                            
                    async.each(ids, function (id, callback) {
                        cityArray.push(parseInt(id._id)); //pass this to an external array
                    });

                    Listing.find({ country : { $in: cityArray } })
                        .populate({ path: 'country', select: 'name' })
                        .populate({ path: 'state', select: 'name' })
                        .populate({ path: 'city', select: 'name' })
                        .populate({ path: 'category', select: 'name' })
                        .exec(function (err, listings) {
                            if (err) {
                                return res.json(err);
                            }
                        return res.json(listings);
                    });
                            
                });
           
                Category.find({ 'name': new RegExp(search, 'i') }).select('_id').exec((err,ids)=>{ 
                        if(err){
                            return res.json(err);
                        } 
                            
                    async.each(ids, function (id, callback) {
                        categoryArray.push(parseInt(id._id)); //pass this to an external array
                    });

                    Listing.find({ state: { $in: categoryArray } })
                        .populate({ path: 'country', select: 'name' }) //search for them one after the other and plug then in as an obj
                        .populate({ path: 'state', select: 'name' })
                        .populate({ path: 'city', select: 'name' })
                        .populate({ path: 'category', select: 'name' })
                        .exec(function (err, listings) {
                            if (err) {
                                return res.json(err);
                            }
                    //    return res.json(listings);
                    });
                            
                });

                
        
    /*   

       
        async.waterfall([
            function getCountry(callback) {
                Country.find({ name: new RegExp(search, 'i') }).select('_id').exec((err, ids) => {
                    if (err) {
                        return res.json(err);
                    }
                    async.each(ids, function (id, callback) {
                        countryArray.push(id); //pass this to an external array
                    });

                    Listing.find({country:{$in: countryArray}})
                            .populate({ path: 'country', select: 'name' }) //search for them one after the other and plug then in as an obj
                            .populate({ path: 'state', select: 'name' })
                            .populate({ path: 'city', select: 'name' })
                            .populate({ path: 'category', select: 'name' })
                            .exec(function (err, listings) {
                                if (err) {
                                    callback('error', err);
                                }
                                callback(null, listings);
                            });
                });  
            }, //first function ends here
            function getState(listings, callback) {
                lists = [];
                State.find({ name: new RegExp(search, 'i') }).select('_id').exec((err, ids) => {
                    if (err) {
                        return res.json(err);
                    }
                    async.each(ids, function (id, callback) {
                        stateArray.push(id); //pass this to an external array
                    });

                    Listing.find({ country: { $in: countryArray } })
                        .populate({ path: 'country', select: 'name' }) //search for them one after the other and plug then in as an obj
                        .populate({ path: 'state', select: 'name' })
                        .populate({ path: 'city', select: 'name' })
                        .populate({ path: 'category', select: 'name' })
                        .exec(function (err, listings) {
                            if (err) {
                                callback('error', err);
                            }
                            callback(null, listings);
                        });

                });

                
            } //end of second query function
        ], function (err, posts) {
            if (err) {
                return res.json(err)
            }
            return res.json(posts);
        });
    
       */


    /*     Listing.find({
             $or: [{ 'country': country_id }, { 'state': state_id },
                 { 'category': category_id }, { 'city': city_id }, { 'landmark': new RegExp(search, 'i')},
                 { 'title': new RegExp(search, 'i') }, { 'country' : { $in: [countryArray] }}]
         })
     
             .populate({ path: 'country', select: 'name'}) //search for them one after the other and plug then in as an obj
             .populate({ path: 'state', select: 'name'})
             .populate({ path: 'city', select: 'name'})
             .populate({ path: 'category', select: 'name'})
             
             .exec(function (err, results) {
             if (err) {
                 return res.json(err);
             }
             return res.json(results);
         });
      */
    });

    
    //api for signaling channel (video and audio)

    //api to pull contacts online
    api.post('/onlineContacts',function(req,res){
        const id = clean(req.body.id,res,req),
                users=[];

        //getting buddies i added and confirmed
        Contact.find({recid:id,status:1}).select('senderid').exec(function(err,user){
            async.each(user,function(u,callback){
                    users.push(u.senderid); //pass this to an external array
            });
        });

            //getting buddies that added me and i confirmed
        Contact.find({senderid:id,status:1}).select('recid').exec(function(err,user){
            async.each(user,function(u,callback){
                users.push(u.recid);//pass this to an external array
            });

                //use the ids and get the detils of those that are online
            User.find({_id:{$in:users},status:true},'fname sname profileImg _id usertype phone country state status',function(err, buddies){
                if(err){
                    res.json(err);
                }
                    //sending out buddies details
                if(buddies.length<1) {
                    return res.json([{fname:"No Contacts online"}]);
                }else{
                     return res.json(buddies);
                }
            });
        });

    });

    //for alert(notification)

    //api for updating service of a user
    api.post('/services',function(req,res){
        const id = clean(req.body.userid,res,req),
            skill= clean(req.body.service,res,req);
        User.findOneAndUpdate({_id:id},{ $addToSet: { vendors:{name:skill}  } },function (err, user) {
            if(err){
                res.json(err);
            }
            return res.json(skill);
        });
    });

    //api to retrieve the services of a user
    api.post('/getServices',function(req,res){
        const id = clean(req.params.userid,res,req);
        User.findOne({_id:id},'service _id',function (err, user) {
            if(err){
                res.json(err);
            }
            return res.json(user);
        });
    });

  //api for logout
    api.post('/logout',(req,res)=>{
        const id = clean(req.body.id,res,req);
        User.findOneAndUpdate({_id:id}, { $set:{ status:false}},function(err,user){
            if(err){
                return res.json({success:false,message:"Please try again"});
            }

            return res.json("succesfully Logout");
        });
    });

    //api to retrieve messages for a specific user
    api.post('/getMessages',(req,res)=>{
           const  id = clean(req.body.id,res,req),
                senderid = clean(req.body.fromid,res,req);

            Message.find({toid:id,read:"unread",fromid:senderid},function(req,res){
                //send the messagess to the interface
            });
    });

    //api for unread message count for a specific user
    api.post('/count',(req,res)=>{
        const id = clean(req.body.id,res,req);
        Message.find({toid:id,read:"unread"}).count().exec(function(err,count){
            if(err){
                console.log(err);
            }
            res.json(count);
        });
    });

    //api for checking if there a friend request
    api.post('/chkBudyRes',(req,res) =>{
        const id = clean(req.body.id,res,req);
       //query the contact list for friend request
        Contact.find({recid:id,status:0},function(err,request){
            res.json(request);
        });
    });

    //api to delete services
    api.post('/deleteService',(req,res) =>{
        const  id = clean(req.body.userid,res,req),
            serviceName = clean(req.body.serviceName,res,req),
            serviceid = clean(req.body.serviceid,res,req);

        //query User and delete
        User.update({_id:id},{$pull:{service:{_id:serviceid}}},function(err,result){
            res.json(result);
        });

    });

    api.post('/save/categories',(req,res)=>{
        const name = req.body.name;
        const category = new Category({
            name: name
        });

        category.save(function (err) {

            if (err) {
                 return res.json({success:false,message:"The Category Couldn't Save. Please Try Again."});
            }

            res.json({success:true,message:'Category Successfully Saved.'});


        });
    });

    //check for unread messagess in inbox and mark ass read
    api.post('/markread',(req,res) => {
        const id = clean(req.body.id,res,req),
         userid = clean(req.body.userid,res,req);

        Message.update({$and:[{fromid:id},{toid:userid}],read:"unread"}, { $set:{ read:"read"}},function(err,user){
            if(err){
                console.log(err);
            }

        });
    });

    //read last message
    api.post('/checkinbox',(req,res) =>{
        const id = clean(req.body.id,res,req),
            userid = clean(req.body.userid,res,req);

        Message.find({$or:[{$and:[{fromid:id},{toid:userid}]},{$and:[{fromid:userid},{toid:id}]}]}).sort('-_id').limit(10).exec(function(err,msg){
            if(err){
                console.log(err);
            }
            res.json(msg);
        });
    });

    //get all listings a vendor offers
    api.get('/listings/:id',(req,res)=>{
        const id = clean(req.params.id,res,req);
        Listing.find({user_id:id})
        .populate({ path: 'country',select:"name -_id"})
            .populate({ path: 'state', select: "name -_id"})
            .populate({ path: 'city', select: "name -_id"})
            .populate({ path: 'category', select: "name -_id"})
        .exec(function(err,listings){
            if(err){
                return res.status(401).send({message:err});
            }
            return res.json(listings);
        });

    });

    //get each  listing individually
    api.get('/listing/:id',(req,res) => {

    });



    //save vendor listing
    api.post('/listing', (req, res) => {   
        const title = clean(req.body.data.title, res, req),
            category_id = clean(req.body.data.category_id, res, req),
            country_id = clean(req.body.data.country_id, res, req),
            state_id = clean(req.body.data.state_id, res, req),
            city_id = clean(req.body.data.city_id, res, req),
            landmark = clean(req.body.data.landmark, res, req),
            highest = clean(req.body.data.highest, res, req),
            least = clean(req.body.data.min, res, req),
            user_id = clean(req.body.user_id, res, req),
            description = clean(req.body.data.description, res, req);

            // Note upload image and get the path
            
        const listing = new Listing({
            title: title,
            description: description,
            landmark: landmark,
            country: country_id,
            category: category_id,
            state: state_id,
            city: city_id,
            user_id: user_id,
            least: least,
            highest: highest
        });
        listing.save(function (err) {
            if (err) {
                return res.json({ success: false, message: "Listing was not successfully added, Please try again." });
            } else {
                return res.json({ success: true, message: "Your listing has been successfully added" });
            }
        });
        
    });

    //socket io for  both private chat and chatroom
    io.on('connection',(socket)=>{
        console.log("A user has connected");
        socket.emit('reconnect',{msg:"reconnect user"});

        // when the client emits 'adduser', this listens and executes
        //socket.on('adduser', function(data){
            // add the client's username to the global list
        //	usernames[socket.id] =data;

        //here every user joins a room after there userId
        socket.on('login',(data)=>{
            console.log(data.userid+ "room created");
            socket.join(data.userid);
        });


        socket.on('reconectUser',(data)=>{
               socket.join(data.userid);
        });

        socket.on('sendMsg',(data)=>{
            const userto = data.toid;

            //save to db as read still check the logic here
            const message = new Message({
                    toid:userto,
                    fromid:data.fromid,
                    fromuser:data.fromuser,
                    message:data.msg,
                        read:"unread"
                });
                message.save((err)=>{
                    if(err){
                        console.log(err);
                    }
                    io.to(userto).emit('newMsg',{data});
                });
        });


        // when the user disconnects.. perform this
        socket.on('disconnect', ()=>{
            // remove the username from global usernames list
            delete usernames[socket.username];
            // update list of users in chat, client-side
            io.emit('updateusers', usernames);
            // echo globally that this client has left
            socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
        });



});

    return api;
}

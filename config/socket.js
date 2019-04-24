module.exports = function(app,express,sanitizer,io){

  io.on('connection',function(){
      console.log('connection io');
  });

 return io;
}

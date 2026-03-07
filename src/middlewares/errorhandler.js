const errorhandler = (err,req,res,next)=>{
  console.log(err);
  res.status(500).send({
    success:false,
    message:"server error"
  })
}
export default errorhandler
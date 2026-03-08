const errorhandler = (err, req, res, next) => {
  console.log(err);
  if (err.name == "JsonWebTokenError") {
    res.status(401).send({
      success: false,
      error: "Unauthorized, token missing or invalid"
    })
  }
  else {
    res.status(500).send({
      success: false,
      error: "server error"
    })
  }
}
export default errorhandler
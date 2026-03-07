import app from "./src/app.js"

const port = 3000 || process.env.PORT
app.listen(port,()=>{
  console.log(`The app is listeing to the port ${port}`);
})
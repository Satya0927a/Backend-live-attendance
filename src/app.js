import express from "express"
import { authrouter } from "./controller/auth_cnt.js"
import errorhandler from "./middlewares/errorhandler.js"
const app = express()
app.use(express.json())

app.get('/',async(req,res)=>{
  res.send("the app is running ")
})
app.use('/auth',authrouter)
app.use(errorhandler)

export default (app)
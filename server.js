import http from "http"
import app from "./src/app.js"
import { websocketinit } from "./src/websocket.js"

const port = 3000 || process.env.PORT
const server = http.createServer(app)
websocketinit(server)
server.listen(port,()=>{
  console.log(`The app is listeing to the port ${port}`);
})
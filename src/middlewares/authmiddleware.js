import jwt from "jsonwebtoken"
import { prisma } from "../utils/prisma.js"
const authmiddleware = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization
    if (!authorization) {
      return res.status(401).send({
        success: false,
        error: "Unauthorized, token missing or invalid"
      })
    }
    const token = authorization.replace("Bearer ", "")
    const payload = jwt.verify(token, process.env.SECRET)
    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId
      }
    })
    if (!user) {
      return res.status(401).send({
        success: false,
        error: "Unauthorized, token missing or invalid"
      })
    }
    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}
export default authmiddleware
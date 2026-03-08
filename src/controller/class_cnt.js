import express from "express"
import { prisma } from "../utils/prisma.js"
const classrouter = express.Router()

classrouter.post('/', async (req, res, next) => {
  if (req.user.role != "TEACHER") {
    return res.status(403).send({
      success: false,
      error: "Forbidden, not a class teacher"
    })
  }
  const { className } = req.body
  if (!className) {
    return res.status(400).send({
      success: false,
      error: "Invalid inputs"
    })
  }
  const newclass = await prisma.class.create({
    data:{
      className:className,
      teacherId:req.user.id
    }
  })
  res.status(201).send({
    success:true,
    data:{
      id:newclass.id,
      className:newclass.className,
      teacherId:newclass.teacherId,
      studentIds:[]
    }

  })
})

export default classrouter
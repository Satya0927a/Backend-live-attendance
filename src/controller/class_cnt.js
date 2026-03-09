import express from "express"
import { prisma } from "../utils/prisma.js"
const classrouter = express.Router()

classrouter.post('/', async (req, res, next) => {
  try {
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
      data: {
        className: className,
        teacherId: req.user.id
      }
    })
    res.status(201).send({
      success: true,
      data: {
        id: newclass.id,
        className: newclass.className,
        teacherId: newclass.teacherId,
        studentIds: []
      }

    })
  } catch (error) {
    next(error)
  }
})
classrouter.get('/:id',async(req,res,next)=>{
  const classId = parseInt(req.params.id)
  const classData = await prisma.class.findUnique({
    where:{
      id:classId
    },
    include:{
      students:{
        select:{
          student:{
            select:{
              id:true,
              name:true,
              email:true
            }
          }
        }
      }
    }
  })
  if(!classData){
    return res.status(404).send({
      success:false,
      error:"class not found"
    })
  }
  const isastudent = await prisma.student.findUnique({
    where:{
      classId_studentId:{
        classId:classId,
        studentId:req.user.id
      }
    }
  })
  if(!isastudent && classData.teacherId != req.user.id){
    return res.status(403).send({
      success:false,
      error:"you dont have access to this class"
    })
  }
  res.send({
    success:true,
    data:classData
  })

})

classrouter.post('/:id/addstudent', async (req, res, next) => {
  try {
    
    if (req.user.role != "TEACHER") {
      return res.status(403).send({
        success: false,
        error: "Forbidden, not a class teacher"
      })
    }
    const {studentId} = req.body
    const classId = parseInt(req.params.id)
    if(!studentId){
      return res.status(400).send({
        success:false,
        error:"Invalid input"
      })
    }
    const fetchclass = await prisma.class.findUnique({
      where:{
        id:classId
      }
    })
    if(!fetchclass || fetchclass.teacherId != req.user.id){
      return res.status(404).send({
        success:false,
        error:"Class doesnt exists"
      })
    }
    try {
      await prisma.student.create({
        data:{
          studentId:studentId,
          classId:classId
        }
      })
    } catch (error) {
      const errortype = error.meta.driverAdapterError.cause.kind
      console.log(errortype);
      if(errortype == "UniqueConstraintViolation"){
        return res.status(404).send({
          success:false,
          error:"student already in the class"
        })
      }
      else if(errortype == "ForeignKeyConstraintViolation"){
        return res.status(404).send({
          success:false,
          error:"Student not found"
        })
      }
      next(error)
    }
    const updatedclass = await prisma.class.findUnique({
      where:{
        id:classId
      },
      include:{
        students:{
          select:{
            studentId:true
          }
        }
      }
    })
    res.status(200).send({
      success:true,
      data:{
        id:updatedclass.id,
        className:updatedclass.className,
        teacherId:updatedclass.teacherId,
        studentId:updatedclass.students
      }
    })
  } catch (error) {
    next(error)
  }
})

export default classrouter
import express from "express"
import { prisma } from "../utils/prisma.js"
const classrouter = express.Router()

//? to create a new class
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
//? to get detail about a class
classrouter.get('/:id', async (req, res, next) => {
  const classId = parseInt(req.params.id)
  const classData = await prisma.class.findUnique({
    where: {
      id: classId
    },
    include: {
      students: {
        select: {
          student: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  })
  if (!classData) {
    return res.status(404).send({
      success: false,
      error: "class not found"
    })
  }
  const isastudent = await prisma.student.findUnique({
    where: {
      classId_studentId: {
        classId: classId,
        studentId: req.user.id
      }
    }
  })
  if (!isastudent && classData.teacherId != req.user.id) {
    return res.status(403).send({
      success: false,
      error: "you dont have access to this class"
    })
  }
  res.send({
    success: true,
    data: classData
  })
})
//? to fetch all the students in a class
classrouter.get('/:id/students', async (req, res, next) => {
  try {
    if (req.user.role != "TEACHER") {
      return res.status(403).send({
        success: false,
        error: "Forbidden only a teacher can access"
      })
    }
    const classId = parseInt(req.params.id)
    const fetchclass = await prisma.class.findUnique({
      where: {
        id: classId
      }
    })
    if (!fetchclass) {
      return res.status(404).send({
        success: false,
        error: "class not found"
      })
    }
    if (fetchclass.teacherId != req.user.id) {
      return res.status(404).send({
        success: false,
        error: "You dont have access to this class"
      })
    }
    const students = await prisma.student.findMany({
      where: {
        classId: classId
      },
      select: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    res.send(students)
  } catch (error) {
    next(error)
  }
})
//? to add a new student only by the teacher
classrouter.post('/:id/addstudent', async (req, res, next) => {
  try {

    if (req.user.role != "TEACHER") {
      return res.status(403).send({
        success: false,
        error: "Forbidden, not a class teacher"
      })
    }
    const { studentId } = req.body
    const classId = parseInt(req.params.id)
    if (!studentId) {
      return res.status(400).send({
        success: false,
        error: "Invalid input"
      })
    }
    const fetchclass = await prisma.class.findUnique({
      where: {
        id: classId
      }
    })
    if (!fetchclass) {
      return res.status(404).send({
        success: false,
        error: "Class doesnt exists"
      })
    }
    if (fetchclass.teacherId != req.user.id) {
      return res.status(404).send({
        success: false,
        error: "You dont have access to this class"
      })
    }
    const user = await prisma.user.findUnique({
      where: {
        id: studentId
      }
    })
    if (!user) {
      return res.status(404).send({
        success: false,
        error: "user not found to add as student "
      })
    }
    if (user.role != "STUDENT") {
      return res.status(403).send({
        success: false,
        error: "a teacher cannot be added as a student to a class"
      })
    }
    try {
      await prisma.student.create({
        data: {
          studentId: studentId,
          classId: classId
        }
      })
    } catch (error) {
      const errortype = error.meta.driverAdapterError.cause.kind
      console.log(errortype);
      if (errortype == "UniqueConstraintViolation") {
        return res.status(404).send({
          success: false,
          error: "student already in the class"
        })
      }
      else if (errortype == "ForeignKeyConstraintViolation") {
        return res.status(404).send({
          success: false,
          error: "Student not found"
        })
      }
      next(error)
    }
    const updatedclass = await prisma.class.findUnique({
      where: {
        id: classId
      },
      include: {
        students: {
          select: {
            studentId: true
          }
        }
      }
    })
    res.status(200).send({
      success: true,
      data: {
        id: updatedclass.id,
        className: updatedclass.className,
        teacherId: updatedclass.teacherId,
        studentId: updatedclass.students
      }
    })
  } catch (error) {
    next(error)
  }
})
//? for student to fetch their attendance 
classrouter.get('/:id/my-attendance', async (req, res, next) => {
  try {
    const classId = parseInt(req.params.id)
    const studentId = req.user.id
    if (req.user.role != "STUDENT") {
      return res.status(403).send({
        success: false,
        error: "forbidden, only students can access this route"
      })
    }
    const student = await prisma.student.findUnique({
      where: {
        classId_studentId: {
          classId: classId,
          studentId: studentId
        }
      },
      select: {
        classId: true,
        status: true
      }
    })
    if (!student) {
      return res.status(404).send({
        success: false,
        error: "Class or the student not found"
      })
    }
    res.send({
      success: true,
      data: student
    })
  } catch (error) {
    next(error)
  }
})
export default classrouter
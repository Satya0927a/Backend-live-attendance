import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import userinputvalidate from '../middlewares/userinputvalidate.js'
import { prisma } from '../utils/prisma.js'
import authmiddleware from '../middlewares/authmiddleware.js'
const authrouter = express.Router()

authrouter.post('/signup', userinputvalidate, async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body
    if (!name || !email || !password || !role) {
      return res.status(400).send({
        success: false,
        error: "Invalid request schema"
      })
    }
    const encrypt = await bcrypt.hash(password, 10)
    const newuser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        passwordHash: encrypt,
        role: role.toUpperCase()
      }
    })
    res.status(201).send({
      success: true,
      data: {
        id: newuser.id,
        name: newuser.name,
        email: newuser.email,
        role: newuser.role
      }

    })
  } catch (error) {
    if (error.name == "PrismaClientKnownRequestError") {
      return res.status(400).send({
        success: false,
        error: "Email already exists"
      })
    }
    next(error)
  }
})

authrouter.post('/login', userinputvalidate, async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        error: "Invalid request schema"
      })
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email
      }
    })
    if (!user) {
      return res.status(400).send({
        success: false,
        error: "Invalid email or password"
      })
    }
    const passverify = await bcrypt.compare(password, user.passwordHash)
    if (!passverify) {
      return res.status(400).send({
        success: false,
        error: "Invalid email or password"
      })
    }
    const payload = {
      userId: user.id,
      role: user.role
    }
    const token = jwt.sign(payload, process.env.SECRET)
    res.send({
      success: true,
      data: {
        token: token
      }
    })
  } catch (error) {
    next(error)
  }
})

authrouter.get('/me', authmiddleware, async (req, res, next) => {
  const {id,name,email,role} = req.user
  try {
    res.send({
      success:true,
      data:{
        id:id,
        name:name,
        email:email,
        role:role
      }
    })
  } catch (error) {
    next(error)
  }
})

export { authrouter }
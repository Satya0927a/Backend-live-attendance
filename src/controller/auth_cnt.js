import express from 'express'
import bcrypt from 'bcrypt'
import userinputvalidate from '../middlewares/userinputvalidate.js'
import { prisma } from '../utils/prisma.js'
const authrouter = express.Router()

authrouter.post('/signup',userinputvalidate,async(req,res,next)=>{
  try {
    const {name,email,password,role} = req.body
    if(!name || !email || !password || !role){
      return res.status(400).send({
        success:false,
        error:"Invalid request schema"
      })
    }
    const encrypt =  await bcrypt.hash(password,10)
    const newuser = await prisma.user.create({
      data:{
        name:name,
        email:email,
        passwordHash:encrypt,
        role:role.toUpperCase()
      }
    })
    res.status(201).send({
      success:true,
      data:{
        id: newuser.id,
        name:newuser.name,
        email:newuser.email,
        role:newuser.role
      }
  
    })
  } catch (error) {
    if(error.name == "PrismaClientKnownRequestError"){
      return res.status(400).send({
        success:false,
        error:"Email already exists"
      })
    }
    next(error)
  }
})

export {authrouter}
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { prisma } from "./utils/prisma.js";
import { activeSession } from "./controller/class_cnt.js";
export const websocketinit = (server) => {
  const wss = new WebSocketServer({ server })
  const connectedUsers = {}

  wss.on("connection", (socket, req) => {
    try {
      const url = new URL(req.url, 'https://localhost')
      const token = url.searchParams.get('token')
      if (!token) {
        socket.send(JSON.stringify({
          event: "ERROR",
          data: {
            message: "token not found"
          }
        }))
        socket.close()
      }
      const payload = jwt.verify(token, process.env.SECRET)
      console.log(payload);
      req.user = payload
      connectedUsers[req.user.userId] = {
        socket: socket,
        role: req.user.role
      }
      socket.on('message', async (buffer) => {
        const parsed = JSON.parse(buffer)
        console.log(parsed);
        console.log(`message by user ${req.user.userId}`, parsed);
        const event = parsed.event
        const data = parsed.data
        console.log(event);

        if (event == "ATTENDANCE_MARKED") {
          if (req.user.role != "TEACHER") {
            return socket.send(JSON.stringify({
              event: "ERROR",
              data: {
                message: "forbidden, teacher only event"
              }
            }))
          }
          if (!activeSession) {
            return socket.send(JSON.stringify({
              event: "ERROR",
              data: {
                message: "No active session found for a class"
              }
            }))
          }
          if (activeSession.teacherId != req.user.userId) {
            return socket.send(JSON.stringify({
              event: "ERROR",
              data: {
                message: "You are not the teacher of this class"
              }
            }))
          }
          const student = await prisma.student.findUnique({
            where: {
              classId_studentId: {
                classId: activeSession.classId,
                studentId: data.studentId
              }
            }
          })
          if (!student) {
            return socket.send(JSON.stringify({
              event: "ERROR",
              data: {
                message: "student not found on this id"
              }
            }))
          }
          activeSession.attendance[`${activeSession.classId}_${data.studentId}`] = data.status
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                event: "ATTENDANCE_MARKED",
                data: {
                  studentId:data.studentId,
                  status:data.status
                }
              }))
            }
          })

        }
      })
    } catch (error) {
      socket.send(JSON.stringify({
        event: "ERROR",
        data: {
          message: "Server error"
        }
      }))
      socket.close()
    }
  })
}
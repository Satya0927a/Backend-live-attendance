import emailValidate from "./emailvalidate.js"

const userinputvalidate = (req, res, next) => {
  try {
    const { email, password, role } = req.body
    if (email && !emailValidate(email)) {
      return res.status(400).send({
        success: false,
        message: "Invalid email format"
      })
    }
    if (password && password.length < 6) {
      return res.status(400).send({
        success: false,
        message: "password must be min 6 char long"
      })
    }
    if (role && !['student','teacher'].includes(role)) {
      return res.status(400).send({
        success: false,
        message: "role must be student or teacher"
      })
    }
    next()
  } catch (error) {
    next(error)
  }
}
export default userinputvalidate
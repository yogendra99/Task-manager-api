const express = require('express')
require('./db/mongoose')                                       //only for mongoose cnt to db
const userRouter = require('./routers/users')                  
const tasksRouter = require('./routers/tasks')                   

const app = express()
const port = process.env.PORT 

app.use(express.json())
app.use(userRouter)                                                 
app.use(tasksRouter)                                                     


app.listen(port, () => {
    console.log("Everything is all right")
    console.log('Server is up on port ' + port)
})

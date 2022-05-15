const mongoose = require('mongoose')

//use for only connect to the db
mongoose.connect(process.env.MONGODB_URL, {
})
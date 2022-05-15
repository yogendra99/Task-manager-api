const mongoose = require('mongoose')

//Explicitly create schema
const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    owner : {
        type: mongoose.Schema.Types.ObjectId,                     //pending
        required: true,
        ref: 'User'                                               //referance to the Particular User Model Like Fore-key
    }
},  {
    timestamps: true
})

const Task = mongoose.model('Task', taskSchema)

module.exports = Task
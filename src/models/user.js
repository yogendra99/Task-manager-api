
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a postive number')
            }
        }
    },
    tokens: [{                                                                   //adding because to track the token
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer                                                         //image binary data stored in db along with user
    }
}, {
    timestamps: true
})

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()                                      //take user into  UserObject so we can manipulate it

    delete userObject.password                                             //deleting password from userObj
    delete userObject.tokens                                               //deleting tokens from userObj
    delete userObject.avatar                                               //deleting avatar img from userObj

    return userObject
}

//Function definition of generateAuthToken
userSchema.methods.generateAuthToken = async function () {                            //call on specific user
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)//sign jwt with user.id i.e is payload store user.id

    user.tokens = user.tokens.concat({ token: token })                            //adding object with token prop into tokens array
    await user.save()                                                                 //saving token into db for specific user
    return token

}

//Function definition of findByCredentials
userSchema.statics.findByCredentials = async (email, password) => {                       //call 
    const user = await User.findOne({ email: email })

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }
    return user
}

// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

//Delete user tasks when user is removed automatcally
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ owner: user._id })
    next()
})

const User = mongoose.model('User', userSchema)                                       //User is model

module.exports = User
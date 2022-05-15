const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')                             //get the token
        const decode = jwt.verify(token, process.env.JWT_SECRET)   
        
        const user = await User.findOne({ _id: decode._id, 'tokens.token': token })  

        if(!user) {
            throw new Error()
        }

        req.token = token                                    //adding token to the (route handler) so they can use later on
        req.user = user                                     //adding user to the (route handler) so they can use later on
        next()                                              //calling next mean user proof there auth and handover control to route
    } catch (e) {
        res.status(401).send('error: Please authenticate.')
    }
}

module.exports = auth
                                 
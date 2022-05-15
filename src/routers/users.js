
const express = require('express')
const User = require('../models/user')
const router = new express.Router()
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')

//Sign UP --- Not registered
router.post('/users', async (req, res) => {

    const user = new User(req.body)

    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })

    } catch (e) {

        res.status(400).send(e)
    }
})

//Login Checking --- already registered
router.post('/users/login', async (req, res) => {
    try {
        //functions
        const user = await User.findByCredentials(req.body.email, req.body.password)     //Checking in whole User Model
        const token = await user.generateAuthToken()            //set up a token on the specific (user) i.e is instance of Model
        res.send({ user : user , token })                                    //send user and token data to the client
    } catch (e) {
        res.status(400).send('something happen wrong in login')
    }
})

//logout one session
router.post('/users/logout', auth , async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((Currtoken) => {
            return Currtoken.token !== req.token
        })
        await req.user.save()
        res.send('Your are now Logout Succesfully!')

    } catch (e) {
        res.status(500).send()
    }

})

//logout all session
router.post('/users/logoutAll', auth , async (req, res) => {
    try {
        req.user.tokens = []                                  //for particular token set all value in empty array 
        await req.user.save()
        res.send('Your are now Logout Succesfully from all Devices!')
    } catch (e) {
        res.status(500).send()
    }

})

//for getting own profile & run only when its auth
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)                                         //req.user assign during auth func, so we use req.user after auth
})

//Updating a single data from the users db i.e you(me)
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

//Deleting a single data from the users db i.e you(/me)
router.delete('/users/me', auth , async (req, res) => {
    try {
       await req.user.remove()
       res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

//middleware auth function for a images
const upload = multer ({
    limits: {
        fileSize: 1000000  //1 Megabyte
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)){                //using regular expression to allow only these files
            return cb(new Error('File must be Image!. Please use jpg, jpeg, png file.'))
        }
        cb(undefined, true)                                                                    //accept the upload
    }
})

//Upload the image
router.post('/users/me/avatar', auth ,upload.single('avatar'), async (req, res) => {         
    //resize and set the format into png 
    const modified_buffer = await sharp(req.file.buffer).resize({ width : 500, height : 500 }).png().toBuffer() 

    req.user.avatar = modified_buffer                             //setting the modified image
    await req.user.save()
    res.send()
},(error, req, res, next) => {                                     //(error, req, res, next) that express know to handle error
    res.status(400).send( {
        error: error.message
    })
})

//Delete the image
router.delete('/users/me/avatar', auth , async (req, res) => {           
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

//Fetch the Image
router.get('/users/:id/avatar', async (req, res) => {        
    try {
        const user = await User.findById(req.params.id)                            //find user by id

        if (!user || !user.avatar) {                                              //if not present
            throw new Error()
        }
        res.set('Content-Type','image/png')                                      //setting the header of express
        res.send(user.avatar)                                                    //send user.avatar
    } catch (e) {
        console.log(e)
        res.status(404).send('Image not found!')
    }
})


module.exports = router
const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

//-----------------------------------------------TASKS-ROUTER-------------------------------------------------------------
//Create a tasks instance in tasks db

router.post('/tasks', auth , async (req, res) => {

    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }

})

//Getting data from the tasks db
//GET /tasks?completed=(T/F)
//limit/Skip
//GET /tasks?limit=10&skip=1----------->Second page
//GET /tasks?sortBy=createdAt : asc/desc
router.get('/tasks', auth, async (req, res) => {
                                                                           
    const matchobj = {}
    const sort = {}

    
    if(req.query.completed) {                                           //req.query.completed--->query from clinet req object
        matchobj.completed = req.query.completed === 'true'              //set/create a prop in matchobj so it use in line 41
     }
    
    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(':') 
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1      
    }
    
    try {
        //const task = await Task.find({ owner : req.user._id })
        await req.user.populate({
            path : 'tasks',
            match : matchobj,
            options : {
                limit : parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        })
        res.send(req.user.tasks)
    } catch (e) {
        res.status(500).send()
    }
})

//Getting a single data from the tasks db
router.get('/tasks/:id', auth ,async (req, res) => {                                //using express route parameter ":/id"

    const _id = req.params.id                                                 

    try {
        //const task = await Task.findById(_id)
       
        const task = await Task.findOne({ _id, owner: req.user._id})                //find task by id and owner to
    
        if (!task) {
            return res.status(404).send('This task exit but you are not the owner')
        }
        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

//Update
router.patch('/tasks/:id', auth, async (req, res) => {

    const updates = Object.keys(req.body)                                                   //converted into array of keys
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update)                                              //return T/F
    })

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    const _id = req.params.id
    try {    
        //new code 
        const task = await Task.findOne({ _id, owner: req.user._id})            //find by id also with respective owner

        if (!task) {
            return res.status(404).send()
        }

        updates.forEach((update) => {
            task[update] = req.body[update]
        })
        await task.save()

        res.send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

//Delete
router.delete('/tasks/:id', auth ,async(req, res) => {
    try {
      const tasks = await Task.findOneAndDelete({_id : req.params.id, owner: req.user._id })//find by id also with respective owner

      if(!tasks) {
          return res.status(404).send()
      }
      res.send(tasks)
    } catch (e) {
        res.status(500).send(e)
    }
})


module.exports = router
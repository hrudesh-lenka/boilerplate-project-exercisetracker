const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

app.use(bodyParser.urlencoded({extended: false}))
// app.use(bodyParser.json())
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});
//console.log(mongoose.connection.readyState);

const Schema = mongoose.Schema;

const exerciseSchema = new Schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: String
})

const userSchema = new Schema({
  username: {type: String, required: true},
  log: [exerciseSchema]
})

const User = mongoose.model('User', userSchema)


const Exercise = mongoose.model('Exercise', exerciseSchema)

app.post('/api/users',(req,res)=>{
  let userName = req.body.username;
  User.find({username: userName},(err,data)=>{
    // console.log(data)
    if(data != ""){
      res.send("Username already taken")
    }
    else{
      let newUser = new User({username: userName})
      User.create(newUser, (err, result)=>{
        if(err){
          console.log(err)
        }else{
          res.json({username: result.username,_id: result._id})
        }
      })
    }
  })
})

app.post('/api/users/:_id/exercises',(req,res)=>{
  
  let id = req.params._id;
  let excerciseDate = req.body.date;
  // let date = req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString()
  // new_date = new_date.toDateString();
  if(excerciseDate == ""){
    excerciseDate = new Date().toDateString();
  }else{
    excerciseDate = new Date(req.body.date).toDateString();
  }

  let newExercise = new Exercise({
      description: req.body.description,
      duration: req.body.duration,
      date: excerciseDate
      })

  User.findByIdAndUpdate(id,
  {$push: {log: newExercise}},
  {new: true},
  (err, data)=>{
    
    if(err){
      console.log(data)
      console.log(err)
      res.send("Unknown userId")
    }else{
      console.log(data)
      const userName = data.username;
      res.json(
          {
            "_id": data.id,
            "username": userName,
            "date": newExercise.date,
            "duration": newExercise.duration,
            "description": newExercise.description
          }
          )
    }
    
  })
  
})

app.get('/api/users/:_id/logs',(req,res)=>{
  userId = req.params._id;
  User.findById(userId,(err,data)=>{
    if(err){
      console.log(err);
    }else{
      let resObject = data;
      if(req.query.from || req.query.to){
        let fromDate = new Date(0);
        let toDate = new Date()
        if(req.query.from){
          fromDate = new Date(req.query.from).getTime()
        }
        if(req.query.to){
          toDate = new Date(req.query.to).getTime()
        }

        resObject.log = resObject.log.filter((exercise)=>{
          let exerciseDate = new Date(exercise.date).getTime()

          return exerciseDate >= fromDate && exerciseDate <= toDate
        })
      }

      if(req.query.limit == undefined){
        resObject['count'] = resObject.log.length;
        //res.json(resObject)
      }else{
        resObject.log = resObject.log.slice(0, req.query.limit)
        resObject['count'] = resObject.log.length;
        //res.json(resObject)
      }
      //resObject['count'] = resObject.log.length;
      res.json({
        "_id": resObject.id,
        "username": resObject.username,
        "count": resObject.count,
        "log": resObject.log
      })
      
    }
  })
})


app.get('/api/users',(req,res)=>{
  User.find({},(err,data)=>{
    if(err){
      console.log(err)
    }else{
    res.json(data)
    }
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

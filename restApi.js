const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

//Connect
mongoose.connect('mongodb://localhost:27017/tasks', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const taskMongoose = require('./models/task');
const userMongoose = require('./models/user');
const passport = require('./passport');

const app = express();
app.use(express.json());

app.use(cors());

//Middleware for Auth
const checkAuth = (req, res, next) => {
    //Bearer <token>

    if(req.headers.authorization){
        const [type, token] = req.headers.authorization.split(' ');

        //Валидация токена
         jwt.verify(token, 'Very secret code', (err, decoded) => {
             if(err){
                 return res.status(403).send();
             }

             req.user = decoded;
             next();
         });
    } else {
        return res.status(403).send();
    }
};

app.use('/tasks', checkAuth);

app.get('/tasks', async (req, res) => {
    //Pages
    const {page = 1, limit = 10} = req.query;
    const tasks = await taskMongoose.find({user: req.user._id}).skip((page - 1) * limit).limit(limit);
    res.status(200).json(tasks);
});

app.get('/tasks/:id', async (req, res) => {
    const task = await taskMongoose.findById(req.params.id);
    res.status(200).json(task);
});

app.post('/tasks', async (req, res) => {
    const task = new taskMongoose({...req.body, user: req.user._id});

    task.save()
    .then((saved) => {
        res.status(204).json(saved);
    })
    .catch(() => {
        res.status(400).json({message: 'Task dont saved'});
    });
});


app.patch('/tasks', async (req, res) => {
    const { id, ...rest} = req.body;

    taskMongoose.updateOne({ _id: id }, rest, function (err, res) {
        if (err) console.log(handleError(err));
    })    
    .then((saved) => {
        res.status(204).json(saved);
    })
    .catch(() => {
        res.status(400).json({message: 'Task dont saved'});
    });
});

app.delete('/tasks/:id', async (req, res) => {    

    taskMongoose.deleteOne({ _id: req.params.id }, function (err, res) {
        if (err) console.log(handleError(err));
    })    
    .then(() => {
        res.status(204).json({message: 'Task deleted'});
    })
    .catch(() => {
        res.status(400).json({message: 'Task dont deleted'});
    });
});


//Register
app.post('/register', async (req, res) => {
    const {repassword, ...restBody} = req.body;
    if(restBody.password === repassword){
        const user = new userMongoose(restBody);
        await user.save();
        return res.status(201).send();
    } else {
        res.status(400).json({messageError: 'Error registration!'});
    }
});

//Auth
app.post('/auth', async (req, res) => {
    const {username, password} = req.body;

    const user = await userMongoose.findOne({email: username});

    if(!user){
        return res.status(401).send();
    }

    if(!user.validatePassword(password)){
        return res.status(401).send();
    }

    const plainData = JSON.parse(JSON.stringify(user));
    delete plainData.password;

    res.status(200).json({
        ...plainData,
        token: jwt.sign(plainData, 'Very secret code'),
    });
});

app.listen(4000, () => {
    console.log('Server works!');
});


/*

POST, http://localhost:4000/tasks
{
	"title":"New task",
    "completed": "false"
}

PATCH, http://localhost:4000/tasks
{
	"id": "5e5806f7f0f92f2101a8dc69",
    "completed": true
}

DELETE, http://localhost:4000/tasks/id

*/

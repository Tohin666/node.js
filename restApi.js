const express = require('express');
const mongoose = require('mongoose');
const request = require('request');
const cheerio = require('cheerio');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

//Connect
mongoose.connect('mongodb://localhost:27017/tasks', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const taskMongoose = require('./models/task');
const userMongoose = require('./models/user');
const newsMongoose = require('./models/news');
const passport = require('./passport');

const app = express();

//Create a server
const server = http.Server(app);
const io = socketIO(server);

io.use((socket, next) => {
    const token = socket.handshake.query.token;

    jwt.verify(token, 'Very secret code', (err) => {
        if (err) {
            return next(new Error('Token not valid'));
        }

        next();
    });
    return next(new Error('Token not valid'));
});

io.on('connection', (socket) => {
    console.log('New connection!');

    socket.on('create', async (data) => {
        const task = new taskMongoose(data);
        const saved = await task.save();

        socket.broadcast.emit(`created:${saved.user}`, saved);
        socket.emit(`created:${saved.user}`, saved);
    });

    socket.on('toggle', async (taskId) => {
        const task = await taskMongoose.findById(taskId);
        await taskMongoose.findOneAndUpdate({ _id: taskId }, { $set: { completed: !task.completed } });

        socket.broadcast.emit(`toggled:${task.user}`, taskId);
        socket.emit(`toggled:${task.user}`, taskId);
    });


    socket.on('getNews', () => {
        getTodayInCinema().then(
            (news) => {
                news.forEach(async (item) => {
                    const newsItem = new newsMongoose(item);
                    await newsItem.save();
                });
                socket.broadcast.emit('Received', news);
                socket.emit('Received', news);
            },
            (err) => {
                console.log('Error:', err);
            }
        );
    });


    socket.on('disconnect', () => {
        console.log('Someone disconnect');
    });
});


app.use(express.json());

app.use(cors());

//Middleware for Auth
const checkAuth = (req, res, next) => {
    //Bearer <token>

    if (req.headers.authorization) {
        const [type, token] = req.headers.authorization.split(' ');

        //Валидация токена
        jwt.verify(token, 'Very secret code', (err, decoded) => {
            if (err) {
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
    const { page = 1, limit = 10 } = req.query;
    const tasks = await taskMongoose.find({ user: req.user._id }).skip((page - 1) * limit).limit(limit);
    res.status(200).json(tasks);
});

app.get('/tasks/:id', async (req, res) => {
    const task = await taskMongoose.findById(req.params.id);
    res.status(200).json(task);
});

app.post('/tasks', async (req, res) => {
    const task = new taskMongoose({ ...req.body, user: req.user._id });

    task.save()
        .then((saved) => {
            res.status(204).json(saved);
        })
        .catch(() => {
            res.status(400).json({ message: 'Task dont saved' });
        });
});


//Register
app.post('/register', async (req, res) => {
    const { repassword, ...restBody } = req.body;
    if (restBody.password === repassword) {
        const user = new userMongoose(restBody);
        await user.save();
        return res.status(201).send();
    } else {
        res.status(400).json({ messageError: 'Error registration!' });
    }
});

//Auth
app.post('/auth', async (req, res) => {
    const { username, password } = req.body;

    const user = await userMongoose.findOne({ email: username });

    if (!user) {
        return res.status(401).send();
    }

    if (!user.validatePassword(password)) {
        return res.status(401).send();
    }

    const plainData = JSON.parse(JSON.stringify(user));
    delete plainData.password;

    res.status(200).json({
        ...plainData,
        token: jwt.sign(plainData, 'Very secret code'),
    });
});

//Для Frontend
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'index.html'));
});

app.get('/auth', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'auth.html'));
});


function getTodayInCinema() {
    return new Promise(function (resolve, reject) {

        const todayInCinema = [];

        request('https://www.kinopoisk.ru/', (err, response, body) => {

            if (!err && response.statusCode === 200) {

                const $ = cheerio.load(body);

                $('.today-in-cinema .carousel__inner').children().each((idx, element) => {

                    if ($(element).find('.film-poster-snippet-partial-component__title').text()) {

                        todayInCinema.push({
                            title: $(element).find('.film-poster-snippet-partial-component__title').text(),
                            description: $(element).find('.film-poster-snippet-partial-component__caption').text()
                        });
                    }
                });
            }

            resolve(todayInCinema);
            reject(new Error('Error'));
        });
    });
}


server.listen(4000, () => {
    console.log('Server works!');
});

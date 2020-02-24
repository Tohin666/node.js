const express = require('express');
const mongoose = require('mongoose');
const request = require('request');
const cheerio = require('cheerio');
const consolidate = require('consolidate');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const taskMongoose = require('./models/task');
const userMongoose = require('./models/user');
const passport = require('./passport');

mongoose.connect('mongodb://localhost:27017/tasks', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const app = express();

app.engine('hbs', consolidate.handlebars);
app.set('view engine', 'hbs');
app.set('views', path.resolve(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
    resave: true,
    saveUninitialized: false,
    secret: '111111',
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
}));

app.use(passport.initialize);
app.use(passport.session);

app.use('/today-in-cinema', passport.mustAuth);
app.use('/tasks', passport.mustAuth);
app.use('/user', passport.mustAuth);


app.get('/tasks', async (req, res) => {
    const { _id } = req.user;
    let tasks = await taskMongoose.find({ user: _id });
    tasks = JSON.parse(JSON.stringify(tasks));
    res.render('tasks', { tasks });
});

app.post('/tasks', async (req, res) => {
    const { _id } = req.user;
    const task = new taskMongoose({ ...req.body, user: _id });
    await task.save();
    res.redirect('/tasks');
});

app.get('/tasks/:id', async (req, res) => {
    const task = await taskMongoose.findById(req.params.id);
    res.render('task', task);
});

app.post('/tasks/update', async (req, res) => {
    const { id, title } = req.body;
    await taskMongoose.updateOne({ _id: id }, { $set: { title } });
    res.redirect('/tasks');
});

app.post('/tasks/remove', async (req, res) => {
    const { id } = req.body;
    await taskMongoose.findByIdAndRemove(id);
    res.redirect('/tasks');
});

app.post('/tasks/complete', async (req, res) => {
    const { id } = req.body;
    await taskMongoose.updateOne({ _id: id }, { $set: { completed: true } });
    res.redirect('/tasks');
});


app.get('/registration', (req, res) => {
    res.render('register');
});

app.post('/registration', async (req, res) => {
    const { repassword, ...restBody } = req.body;
    if (restBody.password === repassword) {
        const user = new userMongoose(restBody);
        await user.save();
        res.redirect('/auth');
    } else {
        res.redirect('/auth?err=err1');
    }
});

app.get('/auth', (req, res) => {
    const { error } = req.query;
    res.render('auth', { error });
});

app.post('/auth', passport.autenticate);

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/auth');
});

app.get('/user', (req, res) => {
    const user = req.user;
    res.render('user', { user });
});

app.post('/user/update', async (req, res) => {
    const userFields = req.body;
    const { _id } = req.user;
    await userMongoose.updateOne({ _id: _id }, { $set: { ...userFields } });
    res.redirect('/user');
});

app.post('/user/skils', async (req, res) => {
    const { skil } = req.body;
    const skils = [...req.user.skils, skil]
    const { _id } = req.user;
    await userMongoose.updateOne({ _id: _id }, { $set: { skils } });
    res.redirect('/user');
});

app.post('/user/remove', async (req, res) => {
    const { idx } = req.body;
    const { skils } = req.user;
    skils.splice(idx, 1);
    const { _id } = req.user;
    await userMongoose.updateOne({ _id: _id }, { $set: { skils } });
    res.redirect('/user');
});


app.get('/today-in-cinema', (req, res) => {
    res.render('today-in-cinema');
});

app.post('/today-in-cinema', (req, res) => {

    getTodayInCinema().then((todayInCinema) => {

        todayInCinema.splice(req.body.count);

        res.render('today-in-cinema', { todayInCinema });
    });
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
        });
    });
}


app.get('/', (req, res) => {
    res.render('main');
});


app.listen(4000, () => {
    console.log('Server works! http://localhost:4000');
});
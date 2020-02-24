const express = require('express');
const mongoose = require('mongoose');
const request = require('request');
const cheerio = require('cheerio');
const consolidate = require('consolidate');
const path = require('path');

const Task = require('./models/task');

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


app.get('/', (req, res) => {
    renderTemplate(res);
});

app.post('/', async (req, res) => {

    const newTask = new Task(req.body);
    await newTask.save();

    renderTemplate(res);
});

app.post('/modify', async (req, res) => {

    switch (req.body.modify) {

        case 'Done':
            Task.updateOne({ _id: req.body.id }, { active: false }, function (err, res) {
                if (err) console.log(handleError(err));
            }).lean();
            break;

        case 'Undone':
            Task.updateOne({ _id: req.body.id }, { active: true }, function (err, res) {
                if (err) console.log(handleError(err));
            }).lean();
            break;

        case 'Delete':
            Task.deleteOne({ _id: req.body.id }, function (err) {
                if (err) console.log(handleError(err));
            }).lean();
            break;

        default:
            break;
    }

    renderTemplate(res);
});


async function renderTemplate(res) {
    const tasks = await Task.find().lean();
    res.render('template', { tasks });
}


app.listen(4000, () => {
    console.log('Server works!');
});
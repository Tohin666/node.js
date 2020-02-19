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


async function renderTemplate(res) {
    const tasks = await Task.find().lean();
    res.render('template', {tasks});
}


app.post('/qqq', (req, res) => {

    getTodayInCinema().then((todayInCinema) => {

        todayInCinema.splice(req.body.count);

        res.render('template', { todayInCinema: todayInCinema });
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


app.listen(4000, () => {
    console.log('Server works!');
});
const express = require('express');
const app = express();

const request = require('request');
const cheerio = require('cheerio');
const consolidate = require('consolidate');
const path = require('path');

app.engine('hbs', consolidate.handlebars);
app.set('view engine', 'hbs');
app.set('views', path.resolve(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {

    res.render('template', {});

});

app.post('/', (req, res) => {

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
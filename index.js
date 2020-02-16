const request = require('request');
const cheerio = require('cheerio');

request('https://www.kinopoisk.ru/', (err, response, body) => {

    if (!err && response.statusCode === 200) {

        const $ = cheerio.load(body);

        $('.today-in-cinema .carousel__inner').children().each((idx, element) => {

            if ($(element).find('.film-poster-snippet-partial-component__title').text()) {

                console.log($(element).find('.film-poster-snippet-partial-component__title').text());
                console.log($(element).find('.film-poster-snippet-partial-component__caption').text());
                console.log('-----------------------------------------------------');
            }
        });
    }
});
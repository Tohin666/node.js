console.log('Hello Node.js!');

const ansi = require('ansi');

const cursor = ansi(process.stdout);

cursor
.white()
.bg.green()
.write('Hello world!')
.bg.reset()
.write('\n')
.blue()
.bg.white()
.write('This is task1 of lesson1!')
.reset()
.bg.reset()
.write('\n');

//ДЗ
//1. Доработать этот скрипт
//2. Расширенное. Взять другую похожую библиотеку и использовать ее для изменения цвета шрифта
//https://www.npmjs.com/package/colors

//Важно. При сдаче ДЗ необходимо удалить папку node_modudes

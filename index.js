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

var colors = require('colors');
 
console.log('This'.green);
console.log('is'.underline.red);
console.log('task2'.inverse);
console.log('of lesson1!'.rainbow);

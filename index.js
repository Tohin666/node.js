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
 
console.log('And'.green);
console.log('this'.underline.red);
console.log('is'.inverse);
console.log('task2'.rainbow);
console.log('of lesson1!'.zebra);

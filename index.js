console.log('Hello Node.js!');

const ansi = require('ansi');

const cursor = ansi(process.stdout);

cursor
.white()
.bg.green()
.write('Hello world!')
.reset()
.bg.reset()
.write('\n');

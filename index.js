const readline = require('readline');

const resourse = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

console.log('Enter 1 or 2. Enter e to exit.');

resourse.on('line', (cmd) => {
    console.log(`You entered: ${cmd}`);

    if (cmd === 'e' || cmd === 'exit') {
        resourse.close();
    }

    const number = Math.round(Math.random()) + 1;

    const spinner = ['|', '/', '-', '\\'];

    let count = 0;
    const timer = setInterval(() => {
        console.clear();
        console.log(spinner[count]);

        if (count != 3) {
            count++;
        } else {
            count = 0;
        }

    }, 500);

    setTimeout(() => {
        clearInterval(timer);
        if (cmd == number) {
            console.log('You guessed it!!!');
        } else {
            console.log('You wrong((');
        }
        console.log('Enter 1 or 2. Enter e to exit.');
    }, 4000);

});
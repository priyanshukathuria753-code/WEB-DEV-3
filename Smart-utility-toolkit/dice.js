const crypto = require("crypto");

function rollDice() {
    const randomNumber = crypto.randomInt(1, 7);
    return randomNumber;
}

for (let i = 1; i <= 5; i++) {
    console.log("Dice Rolled:", rollDice());
}
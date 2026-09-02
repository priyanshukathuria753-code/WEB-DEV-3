const isEven = require("./isEven");

const number = 11;

if (isEven(number)) {
    console.log(number, "is Even");
} else {
    console.log(number, "is Odd");
}
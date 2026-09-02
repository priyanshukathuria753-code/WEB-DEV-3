const operation = process.argv[2];
const a = Number(process.argv[3]);
const b = Number(process.argv[4]);

if (operation === "add") {
    console.log("Result:", a + b);
}

else if (operation === "subtract") {
    console.log("Result:", a - b);
}

else if (operation === "multiply") {
    console.log("Result:", a * b);
}

else if (operation === "divide") {
    console.log("Result:", a / b);
}
else{
    console.log("please enter the valid operation");
}
const http = require("http");

const server = http.createServer((req, res) => {

    if (req.url === "/") {
        res.end("Welcome to Node Server")
    }

    else if (req.url === "/about") {
        res.end("This is the About Page");
    }

    else if (req.url === "/contact") {
        res.end("This is the Contact Page");
    }

    else {
        res.end("404 - Page Not Found");
    }
});

const PORT = 3000;

server.listen(PORT, () => {
    console.log("Server is running on port",PORT);
});
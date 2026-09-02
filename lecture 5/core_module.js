const os=require('os');
const path=require('path');
const fs=require('fs');
const cypto=require('crypto');
const dns=require('dns');
const process=require('process');

// console.log(os.homedir());
// console.log(os.tmpdir());
// console.log(os.totalmem()/(1024*1024*1024),"GB");

// const filePath=path.resolve("core_modules.js");
// const filePath=path.join(__dirname,"core_modules.js");
// console.log(filePath);

// const filepath="FSA-A/lecture 5/core_modules.js"

// console.log(path.basename(filepath));
// console.log(path.dirname(filepath));
// console.log(path.extname(filepath));
// console.log("A")
// const data=fs.readFileSync("./sample.txt","utf-8") //synchronous

// console.log(data);

// fs.readFile("./sample.txt","utf-8",(err,data)=>{  //asynchronous
//     if(err){
//         console.log(err);
//     }else{
//             console.log(data);
//         }
// })

// console.log("B")

// fs.writeFileSync("./sample.txt","Hello World");

// fs.writeFile("./sample.txt","Hello World again",(err)=>{
//     if(err){
//         console.log(err);    
//     }else{
//         console.log("File created");
//     }
// })

// fs.appendFile("./sample.txt","\nHello World",(err)=>{
//     if(err){
//         console.log(err);    
//     }else{
//         console.log("File modified");
//     }
// })  

// fs.unlink("./sample1.txt",(err)=>{
//     if(err){
//         console.log(err);    
//     }else{
//         console.log("File deleted");
//     }
// })

// const password="Alex@1234"

// //same hash code generate
// const hash=cypto.createHash("sha256").update(password).digest("hex");
// // console.log(hash);

// const salt=cypto.randomBytes(16).toString("hex");
// // console.log(salt);
// //different hash code generate
// const saltedHash=cypto.createHmac("sha256",salt).update(password).digest("hex");
// console.log(saltedHash);

// const uid=crypto.randomUUID();
// console.log(uid);


// dns.lookup('www.google.com',(err,address,family)=>{
//     if(err){
//         console.log(err);
//     }else{
//         console.log(address);
//         console.log(family);
//     }
// })

// dns.reverse('8.8.8.8',(err,hostnames)=>{
//     if(err){
//         console.log(err);
//     }else{
//         console.log(hostnames);
//     }
// })

// const data=process.argv
// console.log(data[2],data[3]);

// console.log(process.version)
// console.log(process.pid)
// console.log(process.cwd())

const args=process.argv

console.log(Number(args[2])+Number(args[3]));
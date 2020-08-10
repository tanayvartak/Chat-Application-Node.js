//Chat Application using Node.js
const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage,generateLocation } = require('./utils/messages')
const { addUser, removeUser, getUser, getUserInRoom } = require('./utils/users')
const { get } = require('https')

// 1. Express server
const app = express();
// Create the server and pass the express
const server = http.createServer(app)
const port = process.env.PORT || 3000;
const io = socketio(server)


// 2. Serving up the public directory
const publicDirectoryPath = path.join(__dirname,'../public')

// 3. Express static middleware
app.use(express.static(publicDirectoryPath))


io.on('connection',(socket)=>{
    
    console.log("Connected!")

    // socket.emit('message',generateMessage('Welcome!'))

    // socket.broadcast.emit('message',generateMessage('A new user has joined!'))

    socket.on('join',(option, callback) => {
        const { error, user} = addUser({ id:socket.id, ...option})
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message',generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUserInRoom(user.room)
        })
        callback()
    })
    
    socket.on('sendingMessage',(message,callback)=>{
       
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback("Profanity is not allowed!")
        }
        const user = getUser(socket.id)
        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()
    })

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomaData',{
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }
        
    })

    socket.on('sendLocation',(coords,callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocation(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
})


server.listen(port, ()=>{
    console.log(`Server listening  on port ${port}`)
})
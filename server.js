const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const { userJoin, getCurrentUser, userLeave, getRoomUsers} = require("./utils/users");


const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = 'ChatCord Bot'

// Run when client connects 
io.on('connection', socket=>{
    socket.on('joinRoom',({username,room})=>{
        const user = userJoin(socket.id, username, room);

        socket.join(user.room)
        
    //Welcome the current user
    socket.emit('message', formatMessage(botName, 'Welcome to chatbot'));// this notifies everyone , its more like a in general message 

    //Broadcast when a user connects
    socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));  //this notifies everyone except for the one sending the message 

    //Send users and room info
    io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    })

    //Listen for chat message 
    socket.on('chatMessage', (msg)=>{
        const user = getCurrentUser(socket.id)
        io.to(user.room).emit('message',formatMessage(user.username,msg))
    })

    //run when someone disconnects
    socket.on('disconnect',()=>{
        const user = userLeave(socket.id);
        if(user){
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`))
        }

        //Send users and room info
        io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    })

})

const PORT = process.env.PORT || 3000;

server.listen(PORT, ()=> console.log(`server is running on ${PORT}`))
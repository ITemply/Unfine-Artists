const express = require('express')
const path = require('node:path')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server, {maxHttpBufferSize: 3.5e6, pingTimeout: 60000})

const dotenv = require('dotenv')
dotenv.config()

app.set('views', path.join(__dirname, 'public'))
app.use('/images', express.static('images'));
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))
app.use(cookieParser())

app.get('/', async function(request, response) {
    response.cookie('unfine-artist', 'Extremely')
    console.log('Sending [GET]: /')
    response.render('index')
})

server.listen(3000, () => {
    console.log('Unfine Artists started on port 3000. http://127.0.0.1:3000/')
})
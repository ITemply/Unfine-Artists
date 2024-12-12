const express = require('express')
const path = require('node:path')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const fs = require('fs')

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

const getGameData = function(gameId) {
    const jsonData = fs.readFileSync('./appData/gameData.json')
    const parsedData = JSON.parse(jsonData)

    if (parsedData['games'][gameId] == undefined || parsedData['games'][gameId] == null) {
        return 'No Active Game'
    } else {
        return parsedData['games'][gameId]
    }
}

const setGameData = function(gameId, dataType, data = null) {
    const jsonData = fs.readFileSync('./appData/gameData.json')
    var parsedData = JSON.parse(jsonData)
    
    if (parsedData['games'][gameId] == undefined || parsedData['games'][gameId] == null) {
        if (dataType == 'createGame') {
            parsedData['games'][gameId] = parsedData['games']['gameId']

            const jsonString = JSON.stringify(parsedData, null, 4)
            fs.writeFileSync('./appData/gameData.json', jsonString)
        }

        return 'No Active Game'
    } else {
        if (dataType == 'createGame') {
            return 'Game Id In Use'
        } else if (dataType == 'deleteGame') {
            delete parsedData['games'][gameId]
        } else if (dataType == 'setStatus') {
            parsedData['games'][gameId]['gameStatus'] = data
        } else if (dataType == 'addUser') {
            parsedData['games'][gameId]['gameUsers'].push(data)
        } else if (dataType == 'deleteUser') {
            const userPosition = parsedData['games'][gameId]['gameUsers'].indexOf(data)
            parsedData['games'][gameId]['gameUsers'].splice(userPosition, 1)
        } else if (dataType == 'gameQuestion') {
            parsedData['games'][gameId]['gameQuestion'] = data
        }
    }

    const jsonString = JSON.stringify(parsedData, null, 4)
    fs.writeFileSync('./appData/gameData.json', jsonString)
}

app.get('/', async function(request, response) {
    response.cookie('unfine-artist', 'Extremely')
    console.log('Sending [GET]: /')
    response.render('index')
})

app.get('/host', async function(request, response) {
    response.cookie('unfine-artist', 'Extremely')
    console.log('Sending [GET]: /host')
    response.render('host')
})

app.get('/join', async function(request, response) {
    response.cookie('unfine-artist', 'Extremely')
    console.log('Sending [GET]: /join')
    response.render('join')
})

app.get('/game', async function(request, response) {
    response.cookie('unfine-artist', 'Extremely')

    const ingameCheck = request.cookies.ingame
    if (ingameCheck) {
        console.log('Sending [GET]: /game')
        response.render('game')
    } else {
        response.redirect('/join')
        return
    }
})

server.listen(3000, () => {
    console.log('Unfine Artists started on port 3000. http://127.0.0.1:3000/')
})
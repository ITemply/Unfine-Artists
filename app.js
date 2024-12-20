const express = require('express')
const path = require('node:path')
const crypto = require('crypto')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const fs = require('fs')
const cron = require('node-cron');

const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server, {maxHttpBufferSize: 3.5e6, pingTimeout: 60000})

const dotenv = require('dotenv')
dotenv.config()

app.set('views', path.join(__dirname, 'public'))
app.use('/images', express.static('images'));
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.json({limit: '35mb'}));
app.use(bodyParser.urlencoded({limit: '35mb', extended: true}));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

const validChars = process.env.VALID_CHARS

const getGameData = function(gameId = null) {
    const jsonData = fs.readFileSync('./appData/gameData.json')
    const parsedData = JSON.parse(jsonData)

    if (gameId == null || gameId == undefined) {
        return parsedData['games']
    }

    if (parsedData['games'][gameId] == null) {
        return 'No Game Found'
    } else {
        return parsedData['games'][gameId]
    }
}

const setGameData = async function(gameId, dataType, data = null) {
    const jsonData = fs.readFileSync('./appData/gameData.json')
    var parsedData = JSON.parse(jsonData)
    
    if (parsedData['games'][gameId] == undefined || parsedData['games'][gameId] == null) {
        if (dataType == 'createGame') {
            parsedData['games'][gameId] = parsedData['games']['gameId']

            const jsonString = JSON.stringify(parsedData, null, 4)
            fs.writeFileSync('./appData/gameData.json', jsonString)

            return gameId
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
            const keys = Object.keys(data)
            
            parsedData['games'][gameId]['gameUsers'][keys[0]] = data[keys[0]]
        } else if (dataType == 'deleteUser') {
            const keys = Object.keys(data)

            delete parsedData['games'][gameId]['gameUsers'][keys[0]]
        } else if (dataType == 'gameQuestion') {
            parsedData['games'][gameId]['gameQuestion'] = data
        } else if (dataType == 'setBlacklist') {
            parsedData['games'][gameId]['gameBlacklist'].push(data)
        } else if (dataType == 'setHost') {
            parsedData['games'][gameId]['gameHost'] = data
        } else if (dataType == 'setTime') {
            parsedData['games'][gameId]['gameCreation'] = data
        }
    }

    const jsonString = JSON.stringify(parsedData, null, 4)
    fs.writeFileSync('./appData/gameData.json', jsonString)
}

const randomString = function(length) {
    let result = ''
    const characters = validChars
    const charactersLength = characters.length
    let counter = 0

    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
      counter += 1
    }

    return result
}

const hashString = function(string) {
    return crypto.createHash('sha256').update(string).digest('hex')
}

app.get('/', async function(request, response) {
    const cookieCheck = request.cookies['unfine-artist']
    if (cookieCheck) {
        response.cookie('unfine-artist', hashString(randomString(25)))
    } 

    console.log('Sending [GET]: /')
    response.render('index')
})

app.get('/host', async function(request, response) {
    const cookieCheck = request.cookies['unfine-artist']
    if (cookieCheck == undefined || cookieCheck == null) {
        response.cookie('unfine-artist', hashString(randomString(25)))
    } 

    console.log('Sending [GET]: /host')
    response.render('host')
})

app.post('/api/getGameId', async function(request, response) {
    var idRespone = 'Game Id In Use'

    const hostinggameCheck = request.cookies.hostinggame
    const hostId = request.cookies['unfine-artist']
    const gameData = getGameData()
    const seconds = new Date().getTime() / 1000

    if (hostinggameCheck) {
        response.send(JSON.stringify({
            'Error':'You are already running a game at this time.'
        }))
        return
    }

    for (var entry in gameData) {
        const hostMatch = gameData[entry]['gameHost']

        if (hostId == hostMatch) {
            response.send(JSON.stringify({
                'Error':'You are already running a game at this time.'
            }))
            return
        }
    }

    while (idRespone == 'Game Id In Use') {
        const randomId = randomString(6)
        idRespone = await setGameData(randomId, 'createGame')
    }

    await setGameData(idRespone, 'setHost', hostId)
    await setGameData(idRespone, 'setTime', seconds)

    response.cookie('hostinggame', idRespone, {
        maxAge: 3600000
    })

    response.send(JSON.stringify({
        'gameId': idRespone
    }))

    console.log('Sending [POST]: /api/getGameId')
})

app.get('/join', async function(request, response) {
    const cookieCheck = request.cookies['unfine-artist']
    if (cookieCheck == undefined || cookieCheck == null) {
        response.cookie('unfine-artist', hashString(randomString(25)))
    } 

    console.log('Sending [GET]: /join')

    if (request.cookies.ingame) {
        response.render('join', {serverData: JSON.stringify({'rejoinGame': request.cookies.ingame, 'allowRejoining': true})})
        return
    } else {
        const gameData = getGameData()

        for (var entry in gameData) {
            const game = gameData[entry]

            for (var user in game['gameUsers']) {
                if (user == cookieCheck) {
                    response.render('join', {serverData: JSON.stringify({'rejoinGame': entry, 'allowRejoining': true})})
                    return 
                }
            }
        }
    }

    response.render('join', {serverData: JSON.stringify({'allowRejoining': false})})
})

app.post('/api/checkGameId', async function(request, response) {
    const jsonData = request.body
    const gameId = jsonData['gameId']
    const checkResponse = getGameData(gameId)

    console.log(checkResponse)

    if (checkResponse == 'No Game Found') {
        response.send(JSON.stringify({
            'errorResponse': checkResponse
        }))
        return
    }

    response.cookie('ingame', gameId, {
        maxAge: 3600000
    })

    response.send(JSON.stringify({
        'checkResponse': 'Game Found'
    }))
})

app.get('/game/:gameId', async function(request, response) {
    const cookieCheck = request.cookies['unfine-artist']
    if (cookieCheck == undefined || cookieCheck == null) {
        response.cookie('unfine-artist', hashString(randomString(25)))
    } 

    const ingameCheck = request.cookies.ingame
    const gameId = request.params.gameId

    var gameData = {}

    if (ingameCheck) {
        if (getGameData(ingameCheck) == 'No Game Found' && getGameData(gameId) == 'No Game Found') {
            response.redirect('/join')
            return
        }

        const gameData = getGameData(gameId)
        
        

        console.log('Sending [GET]: /game/' + gameId)
        response.render('game')
    } else {
        response.redirect('/join')
        return
    }
})

app.post('/joinGame', async function(request, response) {
    const userIdCookie = request.cookies['unfine-artist']
    const jsonData = request.body
    const gameId = jsonData['gameId']
    const username = jsonData['username']
    const userId = jsonData['userId']

    const userObject = {}
    userObject[userId] = {
        'username': username
    }

    const gameData = getGameData(gameId)

    if (gameData == 'No Game Found') {
        response.send(JSON.stringify({
            'errorResponse': 'No Active Game Found'
        }))
        return 
    }

    for (var entry in gameData['gameUsers']) {
        const currentUsername = gameData['gameUsers'][entry]['username']

        if (currentUsername == username) {
            response.send(JSON.stringify({
                'errorResponse': 'Username Already Taken'
            }))
            return 
        }
    }

    await setGameData(gameId, 'addUser', userObject)

    response.send(JSON.stringify({
        'checkedUsername': username, 
        'ingame': true, 
        'gameId': gameId, 
        'userId': userId
    }))
})

cron.schedule('* * * * *', async function() {
    const gameData = getGameData()

    for (var entry in gameData) {
        if (entry != 'gameId') {
            const currentTime = new Date().getTime() / 1000
            const currentEntry = gameData[entry]
            const creationTime = currentEntry['gameCreation']
            
            if (creationTime < currentTime - 3600) {
                await setGameData(entry, 'deleteGame')
            }
        }
    }
})

server.listen(3000, () => {
    console.log('Unfine Artists started on port 3000. http://127.0.0.1:3000/')
})
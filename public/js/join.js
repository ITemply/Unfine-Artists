var rejoinGameId

const checkGameId = async function(gameId) {
    const response = await fetch('/api/checkGameId', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({'gameId': gameId}),
        cache: 'default'
    })

    const rawResponse = await response.json()
    const checkedResponse = rawResponse.checkResponse

    const error = rawResponse.errorResponse

    if (error) {
        alert(error)
        return error
    }

    return checkedResponse
}

const onload = function() {
    const serverData = JSON.parse(document.getElementById('serverData').innerHTML)
    const rejoinGame = serverData['rejoinGame']
    const allowRejoining = serverData['allowRejoining']

    if (allowRejoining) {
        document.getElementById('rejoinGame').style.display = 'inline'
        document.getElementById('rejoinText').innerHTML = 'Rejoin: ' + rejoinGame

        rejoinGameId = rejoinGame
    }
}

document.getElementById('joinGameButton').onclick = async function() {
    const gameId = document.getElementById('gameId').value
    const response = await checkGameId(gameId)

    if (response == 'No Game Found') {
        alert('No Game Found')
        return
    } else {
        window.location.href = '/game/' + rejoinGameId
    }
}

document.getElementById('rejoinButton').onclick = async function() {
    const response = await checkGameId(rejoinGameId)

    if (response == 'No Game Found') {
        alert('No Game Found')
        return
    } else {
        window.location.href = '/game/' + rejoinGameId
    }
}
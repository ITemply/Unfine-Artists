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
        return
    }

    return checkedResponse
}

document.getElementById('joinGameButton').onclick = async function() {
    const gameId = document.getElementById('gameId').value

    const response = await checkGameId(gameId)

    if (response == 'No Game Found') {
        alert('No Game Found')
    } else {
        window.location.href = '/game/' + gameId
    }
}
const getGameId = async function() {
    const response = await fetch('/api/getGameId', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        cache: 'default'
    })

    const rawResponse = await response.json()
    const gameId = rawResponse.gameId

    const error = rawResponse.Error

    if (error) {
        alert(error)
        return
    }

    document.getElementById('gameId').innerHTML = 'gameId: ' + gameId
}

document.getElementById('idButton').onclick = async function() {
    await getGameId()
}

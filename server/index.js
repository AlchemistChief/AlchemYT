require('dotenv').config()
const WebSocket = require('ws')
const https     = require('https')
const express   = require('express')
const path      = require('path')
const fs        = require('fs')
const dnssd     = require('dnssd')

const app = express()

const settings = {
    YT_APIKey       : process.env.YT_APIKey,
    Server_APIURL   : process.env.Server_APIURL,
    output_ChunkData: process.env.output_ChunkData === 'true',
    Port            : Number(process.env.PORT) || 3000
}

const server = https.createServer({
    key : fs.readFileSync(path.join(__dirname, 'assets/selfsigned.key')),
    cert: fs.readFileSync(path.join(__dirname, 'assets/selfsigned.crt'))
}, app)

const wss = new WebSocket.Server({ noServer: true })

app.use(express.json())
app.use(express.static(path.join(__dirname, '../public')))

app.get('/settings', (req, res) => {
    res.json({
        "YT-APIKey"    : settings.YT_APIKey,
        "Server-APIURL": settings.Server_APIURL
    })
})

app.get('/selfsigned.crt', (req, res) => { res.sendFile(path.join(__dirname, 'assets/selfsigned.crt')) })

server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws/download') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request)
        })
    } else {
        socket.destroy()
    }
})

wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        try {
            const msg = JSON.parse(message.toString())
            if (!msg.url || !msg.type) {
                ws.send(JSON.stringify({ error: 'Missing url or type in message' }))
                ws.close()
                return
            }

            const downloadfunction = require(path.join(__dirname, 'functions/download.js'))  //removed /
            await downloadfunction(ws, msg.url, msg.type)
        } catch (err) {
            ws.send(JSON.stringify({ error: 'Invalid message format' }))
            ws.close()
        }
    })
})

server.listen(settings.Port, () => {
    new dnssd.Advertisement(dnssd.tcp('https'), settings.Port, {
        name: 'AlchemYT',
        host: 'AlchemYT.local'
    }).start()

    console.log(`HTTPS Server running on port ${settings.Port}`)
    console.log(`Server: https://AlchemYT.local:${settings.Port}`)
})

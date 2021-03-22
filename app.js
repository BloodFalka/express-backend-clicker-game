const express = require('express')
const bodyParser = require('body-parser')
const config = require('config')
const mongoose = require('mongoose')
const { ApolloServer } = require('apollo-server-express')
const  typeDefs = require('./schema')
const  resolvers = require('./resolvers')

const aplServer = new ApolloServer({typeDefs, resolvers})

const mongoDB = process.env.MONGODB_URI || config.get('mongoUri');

const app = express()

app.use(express.json({ extended: true }))

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', 'http://localhost:3000') // update to match the domain you will make the request from
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
	next()
})

app.use(express.static('public'));
app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/user', require('./routes/user.routes'))
app.use('/api/stats', require('./routes/stats.routes'))
aplServer.applyMiddleware({app})

const PORT = config.get('port') || 5000

async function start() {
	try {
		await mongoose.connect(mongoDB, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useCreateIndex: true,
		})
		app.listen(PORT, () => console.log(`🚀 App has been started on port ${PORT}...`))
	} catch (e) {
		console.log('Server Error', e.message)
		process.exit(1)
	}
}

start()
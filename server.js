const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')

const app = express();
const PORT = process.env.PORT || 3001

const corsOptions = {
    origin: "*",
    credentials: true, 
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions))
app.use(bodyParser.json());
app.use(cookieParser());


const db = knex({
    client: 'pg',
    connection: {
        connectionString : process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
        // host : '127.0.0.1',
        // user : 'postgres',
        // password : 'Adebayo7',
        // database : 'Taste-Element-Database'
    }
});

app.post('/login', async (req, res) => {
        const {email, password} = req.body;
        const user = await db.select('*').from('users').where('email', '=', email);
        
        if(!user) {
            return res.status(404).send({
                message: 'user not found'
            })
        }

        if(!await bcrypt.compare(password, user[0].hashpassword)) {
            return res.status(400).send({
                message: 'invalid credentials'
            })
        }

        const token = jwt.sign({_id: user[0].id}, "secret")
        res.cookie('jwt', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'none',
            secure: true
        })

        res.send({
            message: 'success'
        })
})

app.get('/user', async (req, res) => {
    try {
        const cookie = req.cookies['jwt']

        const claims = jwt.verify(cookie, 'secret')

        if(!claims) {
            return res.status(401).send({
                message: 'unauthenticated'
            })
        }

        const user = await db.select('*').from('users').where('id', '=', claims._id);

        const {hashpassword, ...data} = await user[0]
        res.send(data)
    } catch (e) {
        return res.status(401).send({
            message: 'unauthenticated'
        })
    }
    
})

app.post('/logout', async (req, res) => {
    res.cookie('jwt', '', {
        maxAge: 0
    })

    res.send({
        message: 'success'
    })
})

app.post('/register', async (req, res) => {
    try {
        const {name, email, password,} = req.body;
        const salt = await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log(salt)
        console.log(hashedPassword)
        await db('users').insert({
            username: name,
            email: email,
            hashpassword: hashedPassword,
            joined: new Date().toDateString()
        }).returning('*').then(user => {
            res.status(200).json("Registration was successful")
        }).catch(err => {
            console.log(err)
            res.status(400).json("Registration failed email already exist")
        })
    } catch {
        res.status(500).send()
    }
})

app.listen(PORT, () => {
    console.log(`app is running on port ${PORT}`);
})
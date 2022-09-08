const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3001

const corsOptions = {
    origin: ["http://127.0.0.1:5173", "https://pinia-jwt.vercel.app"],
    credentials: true, 
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions))
app.use(bodyParser.json());
app.use(cookieParser());

const database = {
    users: [
        {
            id: 1,
            name: 'Victor',
            email: 'victoradekunle312@gmail.com',
            password: 'cookies'
        },
        {
            id: 2,
            name: 'John',
            email: 'johndoe@gmail.com',
            password: 'cookies'
        },
    ]
}

app.post('/login', async (req, res) => {
    const {email, password} = req.body;
    const user = database.users.filter(user => {
        return user.email === email
    })
    if(!user[0]) {
        return res.status(404).send({
            message: 'user not found'
        })
    }

    if(user[0].password !== password) {
        return res.status(400).send({
            message: 'invalid credentials'
        })
    }
    const token = jwt.sign({email: user[0].email}, "secret")
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

app.get('/user',(req, res) => {
    try {
        const cookie = req.cookies['jwt']

        const claims = jwt.verify(cookie, 'secret')

        if(!claims) {
            return res.status(401).send({
                message: 'unauthenticated'
            })
        }
        const user = database.users.filter(user => {
            return user.email === claims.email
        })

        const {password, ...data} = user[0]
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

app.post('/register', (req, res) => {
    try {
        const {name, email, password,} = req.body;
        database.users.map(user => {
            if(user.email !== email) {
                database.users.push({
                    id: 3,
                    name: name,
                    email: email,
                    password: password
                })
                res.status(200).json(database.users)
            } else {
                res.status(400).json("Registration failed email already exist")
            }
        })
        
    } catch {
        res.status(500).send()
    }
})

app.listen(PORT, () => {
    console.log(`app is running on port ${PORT}`);
})
const express = require('express')
const app = express()
app.use(express.json())
const sqlite3 = require('sqlite3').verbose()
const {open} = require('sqlite')
const path = require('path')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
let db = null
const dbpath = path.join(__dirname, 'covid19IndiaPortal.db')
const func = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3002, () => {
      console.log('running')
    })
  } catch (e) {
    console.log(e)
  }
}

func()

app.post('/login/', async (req, res) => {
  const {username, password} = req.body
  const query3 = `select * from user where username="${username}"`
  const a3 = await db.get(query3)
  console.log(a3)

  if (a3) {
    console.log(a3.password)
    const hashpassword = a3.password
    const comp = await bcrypt.compare(password, hashpassword)
    if (comp) {
      const payload = {username: a3.name}
      const token = jwt.sign(payload, 'tejaram')
      res.send({jwtToken: token})
    } else {
      res.status(400)
      res.send('Invalid password')
    }
  } else {
    res.status(400)
    res.send('Invalid user')
  }
})

const logger = (req, res, next) => {
  const authtoken = req.headers['authorization']
  console.log(authtoken)
  let Token
  if (authtoken !== undefined) {
    Token = authtoken.split(' ')[1]
  }
  if (Token === undefined) {
    res.status(401)
    res.send('Invalid JWT Token')
  } else {
    jwt.verify(Token, 'tejaram', async (error, payload) => {
      if (error) {
        res.status(401)
        res.send('Invalid JWT Token')
      } else {
        next()
      }
    })
  }
}

app.get(`/states/`, logger, async (req, res) => {
  const query = `select * from state`
  const states = await db.all(query)
  res.send(states)
})

app.get(`/states/:stateId/`, logger, async (req, res) => {
  const {stateId} = req.params
  const query2 = `select * from state where state_id=${stateId} `
  const state = await db.get(query2)
  res.send(state)
})

app.post(`/districts/`, logger, async (req, res) => {
  const {districtName, stateId, cases, cured, active, deaths} = req.body
  const query3 = `insert into district (district_name,state_id,cases,cured,active,deaths) values ("${districtName}",${stateId},${cases},${cured},${active},${deaths})`
  await db.run(query3)
  res.send('District Successfully Added')
})

app.get(`/districts/:districtId/`, logger, async (req, res) => {
  const {districtId} = req.params
  const query4 = `select * from district where district_id=${districtId}`
  const district = await db.get(query4)
  res.send(district)
})

app.put(`/districts/:districtId/`, logger, async (req, res) => {
  const {districtId} = req.params
  const {districtName, stateId, cases, cured, active, deaths} = req.body
  const query4 = `UPDATE district SET
  district_name="${districtName}",
  state_id=${stateId},
  cases=${cases},
  cured=${cured},
  active=${active},
  deaths=${deaths}
  WHERE district_id=${districtId}`

  await db.run(query4)
  res.send('District Details Updated')
})

app.delete(`/districts/:districtId/`, logger, async (req, res) => {
  const {districtId} = req.params
  const query5 = `delete from district where district_id=${districtId}`
  await db.run(query5)
  res.send('District Removed')
})

app.get(`/states/:stateId/stats/`, logger, async (req, res) => {
  const {stateId} = req.params
  const query6 = `select sum(cases) as totalCases,
  sum(cured) as totalCured,
  sum(active) as totalActive,
  sum(deaths) as totalDeaths
  from district where state_id=${stateId}`
  const results = await db.get(query6)
  res.send(results)
})

module.exports = app

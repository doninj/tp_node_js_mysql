const express = require('express')
const mysql = require('mysql');
const bodyParser = require('body-parser');
const fs = require('fs')
const port = 3000
const app = express()
const fileUpload = require('express-fileupload'),
  path = require('path'),

  db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "user_node"
  });

db.connect(function (err) {
  if (err) throw err;
  console.log("Connecté à la base de données MySQL!");
});

app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true,
  parameterLimit: 50000
}));
app.use(fileUpload());

app.use(express.static(path.join(__dirname, 'public')));

//affichage des utlisateurs
app.get('/user', (req, res) => {
  db.query('SELECT * FROM users', function (err, result, fields) {
    if (Object.keys(result).length === 0) {
      res.status(400).json(`aucun utilisateur `)
    }
    if (err) res.status(400).send(err)
    res.json(result);
  })
});
//affichage d'un utilisateur par id 
app.get('/user/:id', (req, res, next) => {
  db.query('SELECT * FROM users WHERE user_id = ?', [req.params.id], function (err, result, fields) {
    if (Object.keys(result).length === 0) {
      res.status(400).json(`l\'utilisateur  ${req.params.id} n\'existe pas `)
    } else {
      res.json(result)
    }
    if (err) res.status(400).json(err)
  })
});
// suppression d'un utilisateur par id
app.delete('/user/:id', (req, res) => {
  db.query('SELECT * FROM users WHERE user_id = ?', [req.params.id], function (err, result, fields) {

    db.query('DELETE FROM users WHERE user_id = ?', [req.params.id], function (err, results) {
      if (err) {
        res.status(400).json(err)
      }
      if (result[0].image !== undefined) fs.unlinkSync(`public/${result[0].image}`)
      res.json(`l'utilisateur avec l'id ${req.params.id}  été supprimé`)
    })
  })
})

//Ajouter un utilisateur
app.post('/user/', (req, res) => {
  const params = req.body
  regexEmail = '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$'
  //Verification du mail
  if (!params.email.match(regexEmail)) {
    return res.status(400).json('votre email n\'est pas conforme')
  }
  if (!req.files)
    return res.status(422).json('vous n\'avez pas mis de photo')

  const file = req.files.image
  const file_name = new Date().getTime() + '_' + file.name
  params.image = `image/${file_name}`
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/gif") {
    file.mv('public/image/' + file_name, (err) => {
      if (err)
        return res.status(500).json(err)

      db.query('INSERT INTO users SET ?', [params], (err, row) => {
        if (err) return res.status(500).json(`${err.message}`)
        console.log(row)
        res.send(`users avec les parametres ${params.name}, ${params.firstname}, ${params.email}, ${params.date_naissance} ont été ajouté`)
      })
    })
  } else {
    return res.status(500).json('pas le bon format')
  }

})
//modifier utilisateur
app.put('/user/:id', (req, res) => {
  const params = req.body

  regexEmail = '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$'
  //Verification du mail
  if (!params.email.match(regexEmail)) return res.status(400).json('votre email n\'est pas conforme')

  var file = req.files.image
  const file_name = new Date().getTime() + '_' + file.name
  params.image = `image/${file_name}`

  if (file.mimetype == "image/jpeg" || file.mimetype == "image/png" || file.mimetype == "image/gif") {
    file.mv('public/image/' + file_name, (err) => {
      if (err)
        return res.status(500).json(err)

      db.query('UPDATE users SET ? WHERE user_id = ?', [params, req.params.id], function (err, row) {

        if (!err) res.json(`update fait`)
        else console.log(err)
      })
    })
  } else {
    return res.status(500).json('pas le bon format')
  }
});
app.listen(port, () => console.log(`connecter au port ${port}`))
const bcrypt = require('bcrypt');
const redirectLogin = (req, res, next) => {
    if (!req.session.userId ) {
      res.redirect('./login')
    } else { next (); }
}

module.exports = function(app, shopData) {

    // Handle our routes
    app.get('/',function(req,res){
        res.render('index.ejs', shopData)
    });
    app.get('/about',function(req,res){
        res.render('about.ejs', shopData);
    });
    app.get('/search',function(req,res){
        res.render("search.ejs", shopData);
    });
    app.get('/search-result', function (req, res) {
        //searching in the database
        //res.send("You searched for: " + req.query.keyword);

        let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.query.keyword + "%'"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableBooks:result});
            console.log(newData)
            res.render("list.ejs", newData)
         });        
    });
    app.get('/register', function (req,res) {
        res.render('register.ejs', shopData);                                                                     
    });        

    app.post('/registered', function (req,res) {
        // saving data in database
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        const plainPassword = req.body.password;
                                                                              
        bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
            // Store hashed password in your database.
            let sqlquery = "INSERT INTO `users` (username, first_name, last_name, email, hashedPassword) VALUES (?,?,?,?,?)";
            let newrecord = [req.body.username, req.body.first_name, req.body.last_name, req.body.email, hashedPassword];

            db.query(sqlquery, newrecord, (err, result) => {
                if (err) {
                    return console.error(err.message);
                }
                else {
                    result = 'Hello '+ req.body.first_name + ' '+ req.body.last_name +' you are now registered!  We will send an email to you at ' + req.body.email;
                    result += 'Your password is: '+ req.body.password +' and your hashed password is: '+ hashedPassword;
                    res.send(result);

                }
                
             });

          });
    }); 

    app.get('/login', function(req, res) {
        res.render('login.ejs', shopData);
    });

    app.post('/loggedin' , function(req, res)
    {
        const username = req.body.username;

        let hashedPassword;
        
        let sqlquery = `SELECT hashedPassword FROM users WHERE username ='${username}'`;

        
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            else {
                hashedPassword = result[0].hashedPassword;

                console.log(hashedPassword);
                console.log(username);
                console.log(req.body.password);

                // Save user session here, when login is successful
                req.session.userId = req.body.username;


                // Compare the password supplied with the password in the database
        bcrypt.compare(req.body.password, hashedPassword, function(err, result) {
                if (err) {
          // TODO: Handle error
                    res.redirect('./');
                    console.log(err);
                    res.send(err);
                 }
                else if (result == true) {
          // TODO: Send message
                    res.send(`Login works ${username}` + '<a href='+'./'+'>Home</a>');
                 }
                 else {
                    res.send("Incorect Password");
                }
      });
  
            }
         });
    })

    app.get('/logout', redirectLogin, (req,res) => {
        req.session.destroy(err => {
        if (err) {
          return res.redirect('./')
        }
        res.send('you are now logged out. <a href='+'./'+'>Home</a>');
        })
    })




    app.get('/list', redirectLogin,  function(req, res) {
        let sqlquery = "SELECT * FROM books"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableBooks:result});
            console.log(newData)
            res.render("list.ejs", newData)
         });
    });

    app.get('/addbook', function (req, res) {
        res.render('addbook.ejs', shopData);
     });
 
     app.post('/bookadded', function (req,res) {
           // saving data in database
           let sqlquery = "INSERT INTO books (name, price) VALUES (?,?)";
           // execute sql query
           let newrecord = [req.body.name, req.body.price];
           db.query(sqlquery, newrecord, (err, result) => {
             if (err) {
               return console.error(err.message);
             }
             else
             res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.price);
             });
       });    

       app.get('/bargainbooks', function(req, res) {
        let sqlquery = "SELECT * FROM books WHERE price < 20";
        db.query(sqlquery, (err, result) => {
          if (err) {
             res.redirect('./');
          }
          let newData = Object.assign({}, shopData, {availableBooks:result});
          console.log(newData)
          res.render("bargains.ejs", newData)
        });
    });       

}

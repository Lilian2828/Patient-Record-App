const bcrypt = require('bcrypt');
const redirectLogin = (req, res, next) => {
    if (!req.session.userId ) {
      res.redirect('./login')
    } else { next (); }
}

module.exports = function(app, appData) {

    // Handle our routes
    app.get('/',function(req,res){
        res.render('index.ejs', appData)
    });
    app.get('/about',function(req,res){
        res.render('about.ejs', appData);
    });

    app.get('/search',function(req,res){
        res.render("search.ejs", appData);
    });
    
    app.get('/search-result', function (req, res) {
        //searching in the database for a specific patient
        let sqlquery = "SELECT * FROM patients WHERE name LIKE '%" + req.query.keyword + "%'"; // query database to get all the patients
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, appData, {availablePatients:result});
            console.log(newData)
            res.render("list.ejs", newData)
         });        
    });

    app.get('/register', function (req,res) {
        res.render('register.ejs', appData);                                                                     
    });        

    app.post('/registered', function (req, res) {
        const saltRounds = 10;
        const plainPassword = req.body.password;

        bcrypt.hash(plainPassword, saltRounds, function (err, hashedPassword) {
            // inserting users details in the database
            let sqlquery = "INSERT INTO `users` (username, first_name, last_name, email, hashedPassword) VALUES (?,?,?,?,?)";
            let newUser = [req.body.username, req.body.first_name, req.body.last_name, req.body.email, hashedPassword];

            db.query(sqlquery, newUser, (err, result) => {
                if (err) {
                    return console.error(err.message);
                } else {
                    result = 'Hello ' + req.body.first_name + ' ' + req.body.last_name + ', you are now registered!';
                    res.send(result);
                }
            });
        });
    });

    app.get('/login', function(req, res) {
        res.render('login.ejs', appData);
    });


    app.post('/loggedin' , function(req, res)
    {
        const username = req.body.username;

        let hashedPassword;
        let sqlquery = `SELECT hashedPassword FROM users WHERE username = ?`;

        db.query(sqlquery, username, (err, result) => {
            if (err) {
                res.redirect('./');
            } else {
                hashedPassword = result[0].hashedPassword;

                bcrypt.compare(req.body.password, hashedPassword, function (err, result) {
                    if (err) {
                        res.redirect('./');
                    } else if (result == true) {
                        req.session.userId = req.body.username;
                        res.send(`Login successful, ${username}. <a href='./'>Home</a>`);
                    } else {
                        res.send("Incorrect Password");
                    }
                });
            }
        });
    });

    app.get('/logout', redirectLogin, (req, res) => {
        req.session.destroy(err => {
            if (err) {
                return res.redirect('./');
            }
            res.send('You are now logged out. <a href="./">Home</a>');
        });
    });




    app.get('/list', redirectLogin, function (req, res) {
        let sqlquery = "SELECT * FROM patients";
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, appData, {
                availablePatients: result
            });
            res.render("list.ejs", newData);
        });
    });


    app.get('/patient',function(req,res){
        res.render("patient.ejs", appData);
    });


// Define a route handler to display patients info
app.get('/patient/:id', function(req, res) {
    const patientId = req.params.id;
    // Query the database to fetch the patient data
    db.query('SELECT * FROM patients WHERE id = ?', [patientId], (err, result) => {
        if (err) {
            console.error("Error fetching patient data:", err);
            // Handle the error appropriately, such as rendering an error page
            return res.status(500).render('error', { message: 'Internal Server Error' });
        }
        // Check if patient data was found
        if (result.length === 0) {
            // Render a not found page if patient data does not exist
            return res.status(404).render('error', { message: 'Patient not found' });
        }
        // If patient data exists, render the patient page with the data
        res.render('patient', { patientData: result });
    });
});

 
app.get('/addpatient', redirectLogin, function (req, res) {
    res.render('addpatient.ejs', appData);
 });


// Define a route handler to handle POST requests to add a new patient
app.post('/patientadded', (req, res) => {
    const { name, dob, disease, medical_info } = req.body;
  
    // Insert patient record into the patients table
    db.query('INSERT INTO patients (name, dob, disease, medical_info) VALUES (?, ?, ?, ?)', 
              [name, dob, disease, medical_info], 
              (err, result) => {
      if (err) {
        console.error('Error inserting patient into patients table:', err);
        return res.status(500).send('Error adding patient. Please try again.');
      }
  
      // Redirect to a success page or send a success response
      res.send('Patient added successfully to the database.');
    });
});

 
}

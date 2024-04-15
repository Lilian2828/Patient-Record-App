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
        //searching in the database
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

        // Assuming you have already imported the necessary modules and set up your database connection

// Define a route handler for the patient page
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

 
app.get('/addpatient', function (req, res) {
    res.render('addpatient.ejs', appData);
 });

 // Route Handler for Add Patient Form Submission
app.post('/patientadded', (req, res) => {
    const { name, dob, disease, medical_info } = req.body;
  
    // Insert patient record into the patients table
    db.query('INSERT INTO patients (name, dob) VALUES (?, ?)', [name, dob], (err, result) => {
      if (err) {
        console.error('Error inserting patient into patients table:', err);
        return res.status(500).send('Error adding patient. Please try again.');
      }
  
      // Retrieve the auto-generated patient ID
      const patientId = result.insertId;
  
      // If disease is provided, insert into diseases table
      if (disease) {
        db.query('INSERT INTO diseases (disease_name) VALUES (?)', [disease], (err, result) => {
          if (err) {
            console.error('Error inserting disease into diseases table:', err);
            return res.status(500).send('Error adding patient. Please try again.');
          }
  
          // Retrieve the auto-generated disease ID
          const diseaseId = result.insertId;
  
          // Insert medical information into medical_info table
          db.query('INSERT INTO medical_info (patient_id, disease_id, medical_info) VALUES (?, ?, ?)',
            [patientId, diseaseId, medical_info],
            (err, result) => {
              if (err) {
                console.error('Error inserting medical info into medical_info table:', err);
                return res.status(500).send('Error adding patient. Please try again.');
              }
  
              // Redirect to a success page or send a success response
              res.send('Patient added successfully.');
            });
        });
      } else {
        // If no disease provided, insert medical information with NULL disease_id
        db.query('INSERT INTO medical_info (patient_id, medical_info) VALUES (?, ?)',
          [patientId, medical_info],
          (err, result) => {
            if (err) {
              console.error('Error inserting medical info into medical_info table:', err);
              return res.status(500).send('Error adding patient. Please try again.');
            }
  
            // Redirect to a success page or send a success response
            res.send('Patient added successfully.');
          });
      }
    });
  });


// app.get('/delete-patient/:id', function(req, res) {
//     // Render a form for confirming deletion or perform deletion directly
//     res.render('delete-patient-form', { patientId: req.params.id });
// });

// app.post('/delete-patient/:id', function(req, res) {
//     const patientId = req.params.id;
//     // Perform deletion logic here
//     db.query('DELETE FROM patients WHERE id = ?', [patientId], (err, result) => {
//         if (err) {
//             // Handle any errors that occur during the deletion process
//             console.error("Error deleting patient:", err);
//             return res.status(500).send("Error deleting patient.");
//         }
//         // Check if any rows were affected by the deletion query
//         if (result.affectedRows === 0) {
//             // If no rows were affected, it means the patient with the given id does not exist
//             return res.status(404).send("Patient not found.");
//         }
//         // If deletion was successful, send a success response
//         res.send("Patient deleted successfully.");
//     });
// });




    // Initialize and display the map
 function initMap() {
    // Specify the coordinates for the center of the map
    var myLatLng = { lat: -34.397, lng: 150.644 };
  
    // Create a new map object
    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 8, // Set the initial zoom level
      center: myLatLng // Set the initial center of the map
    });
  
    // Optionally, add markers, polygons, or other overlays to the map
   }     

}

const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const multer = require('multer');
const app = express();

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

// Create MySQL connection
const connection = mysql.createConnection({
    //host: 'localhost',
    //user: 'root',
    //password: '', // Replace with your MySQL password if any
    //database: 'cloudy_crochet'

    host: 'sql.freedb.tech',
    user: 'freedb_athirah',
    password: '$G7nUHGGy3#KE8S', 
    database: 'freedb_crochetapp'
});

// Connect to MySQL database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Set up view engine and static files
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// Route for the home page
app.get('/', (req, res) => {
    const sql = 'SELECT * FROM crochet LIMIT 3'; // Fetching top 3 crochet projects

    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Error fetching crochet projects:', error);
            return res.status(500).send('Error fetching crochet projects');
        }

        // Render 'index.ejs' and pass the crochet projects data
        res.render('index', { crochet: results });
    });
});

// Route to render all crochet projects
app.get('/index', (req, res) => {
    const sql = 'SELECT * FROM crochet'; // Fetch all crochet projects

    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Error fetching crochet projects:', error);
            return res.status(500).send('Error fetching crochet projects');
        }
        res.render('index', { crochet: results });
    });
});

// Route to render individual crochet details
app.get('/crochet/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM crochet WHERE id = ?';

    connection.query(sql, [id], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving crochet project by ID');
        }

        if (results.length > 0) {
            res.render('crochet', { crochet: results[0] }); // Render 'crochet.ejs' with project details
        } else {
            res.status(404).send('Crochet project not found');
        }
    });
});

// Route to render customer details
app.get('/customer/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM orders WHERE id = ?';

    connection.query(sql, [id], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving order by ID');
        }

        if (results.length > 0) {
            res.render('customer', { customer: results[0] }); // Render 'customer.ejs' with order details
        } else {
            res.status(404).send('Order not found');
        }
    });
});

// Route to add a new order
app.get('/addOrder', (req, res) => {
    res.render('addOrder'); // Render form to add new order
});

app.post('/addOrder', upload.single('image'), (req, res) => {
    const { name, email, contact, option, link } = req.body;
    let image = '';

    if (option === 'file' && req.file) {
        image = req.file.filename;
        console.log('File uploaded:', req.file.filename); // Log file upload
    } else if (option === 'link' && link) {
        image = link;
        console.log('Link provided:', link); // Log link provided
    } else {
        console.error('Error: No file or link provided.');
        return res.status(400).send('Please provide either a file or a link.');
    }

    const sql = 'INSERT INTO orders (name, email, contact, image) VALUES (?, ?, ?, ?)';
    connection.query(sql, [name, email, contact, image], (error, results) => {
        if (error) {
            console.error('Error adding order:', error);
            return res.status(500).send('Error adding order');
        }
        res.redirect('/orders'); // Redirect to orders page after successful addition
    });
});

// Route to fetch and render all orders
app.get('/orders', (req, res) => {
    const sql = 'SELECT * FROM orders';

    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Error fetching orders:', error);
            return res.status(500).send('Error fetching orders');
        }
        res.render('orders', { orders: results }); // Render 'orders.ejs' with all orders
    });
});

// Route to edit an order
app.get('/editOrder/:id', (req, res) => {
    const orderId = req.params.id;
    const sql = 'SELECT * FROM orders WHERE id = ?';

    connection.query(sql, [orderId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving order by ID');
        }

        if (results.length > 0) {
            res.render('editOrder', { customer: results[0] }); // Render 'editOrder.ejs' with order details for editing
        } else {
            res.status(404).send('Order not found');
        }
    });
});

app.post('/editOrder/:id', upload.single('image'), (req, res) => {
    const id = req.params.id;
    const { name, email, contact, option, link } = req.body;
    let image = req.body.currentImage;

    if (option === 'file' && req.file) {
        image = req.file.filename;
        console.log('File uploaded:', req.file.filename); // Log file upload
    } else if (option === 'link' && link) {
        image = link;
        console.log('Link provided:', link); // Log link provided
    }

    const sql = 'UPDATE orders SET name = ?, email = ?, image = ?, contact = ? WHERE id = ?';
    connection.query(sql, [name, email, image, contact, id], (error, results) => {
        if (error) {
            console.error('Error updating order:', error);
            return res.status(500).send('Error updating order');
        }
        res.redirect('/orders'); // Redirect to orders page after successful update
    });
});


app.get('/deleteOrder/:id', (req, res) => {
    const orderId = req.params.id;
    const sql = 'DELETE FROM orders WHERE id = ?';

    connection.query(sql, [orderId], (error, results) => {
        if (error) {
            console.error('Error deleting order:', error);
            return res.status(500).send('Error deleting order');
        }
        res.redirect('/orders');
    });
});

// Route for the feedback page to display all feedbacks
app.get('/feedback', (req, res) => {
    const sql = 'SELECT * FROM feedback'; // Fetch all feedbacks

    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Error fetching feedbacks:', error);
            return res.status(500).send('Error fetching feedbacks');
        }
        res.render('feedback', { feedbacks: results }); // Render 'feedback.ejs' with all feedbacks
    });
});

// Route to handle submitting feedback
app.post('/feedback', (req, res) => {
    const { name, email, message } = req.body;

    const sql = 'INSERT INTO feedback (name, email, message) VALUES (?, ?, ?)';
    connection.query(sql, [name, email, message], (error, results) => {
        if (error) {
            console.error('Error adding feedback:', error);
            return res.status(500).send('Error adding feedback');
        }
        res.redirect('/thankyou'); // Redirect to 'thankyou.ejs' after feedback submission
    });
});

// Route to thank you page after submitting feedback
app.get('/thankyou', (req, res) => {
    res.render('thankyou'); // Render 'thankyou.ejs'
});

// Start server on specified port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require('express');
const path = require('path');
const mysql = require('mysql');
const multer = require('multer');
const app = express();
const port = 3900;

app.use('imagenes', express.static(path.join(__dirname, 'imagenes')));

const upload = multer({ dest: 'imagenes/' });

const connection = mysql.createConnection({
    host: '10.0.6.39',
    user: 'estudiante',
    password: 'Info-2023',
    database: 'EntradasTOP'
});

connection.connect((err) => {
    if (err) {
        console.error('Error de conexión a la base de datos: ' + err.stack);
        return;
    }
    console.log('Conexión exitosa a la base de datos.');
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'pagina_principal')));

let userSession = {};

app.post('/login', (req, res) => {
    const { correo, password } = req.body;
    const sql = 'SELECT * FROM Usuarios WHERE correo = ? AND contraseña = ?';
    connection.query(sql, [correo, password], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            userSession = {
                correo: results[0].correo,
                rol: results[0].rol
            };
            res.redirect('/home.html');
        } else {
            res.status(401).json({ message: 'Correo o contraseña incorrectos' });
        }
    });
});


app.get('/logout', (req, res) => {
    userSession = {};
    res.redirect('/');
});

app.get('/getUserSession', (req, res) => {
    res.json(userSession);
});

app.use('/home.html', (req, res, next) => {
    if (!userSession.correo) {
        res.redirect('/index.html');
    } else {
        next();
    }
});

app.post('/guardar_entrada', upload.single('imagen'), (req, res) => {
    console.log(req.file);
    console.log(req.body);
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const { rut, nombre, edad, cantidadDeEntradas, fecha, Asiento} = req.body;
    const imagen = req.file.filename;

    const query = 'INSERT INTO EntradasCompradas (rut, nombre, edad, cantidadDeEntradas, fecha, Asiento, imagenCarnet) VALUES (?,?,?,?,?,?,?)';
    connection.query(query, [rut, nombre, edad, cantidadDeEntradas, fecha, Asiento, imagen], (err) => {
        if (err) throw err;
        res.redirect('/');
    });
});

app.get('/verDetalles/:id', (req, res) => {
    const userId = req.params.id;
    const sql = `SELECT * FROM EntradasCompradas WHERE id = ?`;

    db.query(sql, [userId], (err, result) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        if (result.length === 0) {
            res.status(404).send('User not found');
            return;
        }
        res.json(result[0]);
    });
});

app.delete('/eliminar_entrada/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM EntradasCompradas WHERE id = ?';
    connection.query(sql, [id], (err, result) => {
        if (err) throw err;
        console.log('Entrada eliminada con éxito.');
        res.sendStatus(200);
    });
});

app.post('/modificar_entrada', (req, res) => {
    const { id, rut, nombre, edad, cantidadDeEntradas, fecha, Asiento } = req.body;
    const sql = 'UPDATE EntradasCompradas SET Rut = ?, nombre = ?, edad = ?, cantidadDeEntradas = ?, Fecha = ?, Asiento = ? WHERE id = ?';
    connection.query(sql, [rut, nombre, edad, cantidadDeEntradas, fecha, Asiento, id], (err, result) => {
        if (err) {
            console.error('Error al modificar la entrada:', err);
            res.status(500).send('Error interno del servidor');
            return;
        }
        console.log('Entrada modificada con éxito.');
        res.redirect('/listarEntradas.html');
    });
});

app.get('/modificarEntrada/:id', (req, res) => {
    const id = req.params.id;
    connection.query('SELECT * FROM EntradasCompradas WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error al obtener los datos de la Entrada:', err);
            res.status(500).send('Error interno del servidor');
            return;
        }
        if (result.length === 0) {
            res.status(404).send('Entrada no encontrada');
            return;
        }
        res.json(result[0]);
    });
});

app.get('/verDetalles/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM EntradasCompradas WHERE id = ?';
    connection.query(sql, [id], (err, result) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        if (result.length === 0) {
            res.status(404).send('Entrada no encontrada');
            return;
        }
        res.json(result[0]);
    });
});

app.get('/entradasCompradas', (req, res) => {
    if (userSession.rol == 1) {
        connection.query('SELECT * FROM EntradasCompradas', (err, rows) => {
            if (err) throw err;
            res.send(rows);
        });
    } else {
        res.status(403).send('Acceso denegado');
    }
});

app.post('/registrar_usuario', (req, res) => {
    const { correo, contraseña, rol } = req.body;

    const query = 'INSERT INTO Usuarios (correo, contraseña, rol) VALUES (?, ?, ?)';
    connection.query(query, [correo, contraseña, rol], (err, result) => {
        if (err) {
            console.error('Error al registrar el usuario:', err);
            res.send('Error al registrar el usuario');
        } else {
            console.log('Usuario registrado exitosamente:', result);
            res.redirect('/Index.html');
        }
    });
});

app.listen(port, () => {
    console.log('Servidor corriendo en http://localhost:' + port);
});
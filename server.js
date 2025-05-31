// Código del servidor actualizado
const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/admin', express.static(path.join(__dirname, 'admin')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => console.error('❌ Error al conectar a MongoDB:', err));

const Reserva = require('./models/Reserva');

// Configuración de subida de archivos (comprobantes)
const upload = multer({ dest: 'uploads/' });

// Ruta para procesar el formulario
app.post('/reservar', upload.single('comprobante'), async (req, res) => {
  const { nombre, correo } = req.body;
  const comprobante = req.file;

  if (!nombre || !correo || !comprobante) {
    return res.status(400).json({ error: 'Faltan campos requeridos.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Bingos Dany" <${process.env.EMAIL_USER}>`,
      to: process.env.DESTINO,
      subject: 'Nueva reserva de cartones',
      html: `
        <h2>¡Nueva reserva!</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Correo:</strong> ${correo}</p>
      `,
      attachments: [
        {
          filename: comprobante.originalname,
          path: comprobante.path,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    await Reserva.create({ nombre, correo });

    res.status(200).json({ mensaje: 'Reserva enviada correctamente.' });
  } catch (error) {
    console.error('Error al enviar correo o guardar reserva:', error);
    res.status(500).json({ error: 'Error al procesar la reserva.' });
  }
});

// Ruta para ver reservas desde el panel
app.get('/api/reservas', async (req, res) => {
  try {
    const reservas = await Reserva.find().sort({ fecha: -1 });
    res.json(reservas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

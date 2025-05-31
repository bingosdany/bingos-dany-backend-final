const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    res.status(200).json({ mensaje: 'Reserva enviada correctamente.' });
  } catch (error) {
    console.error('Error al enviar correo:', error);
    res.status(500).json({ error: 'Error al enviar el correo.' });
  }
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ✅ PUERTO CORREGIDO para Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

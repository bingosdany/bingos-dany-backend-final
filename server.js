
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const multer = require("multer");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, file.originalname),
});

const upload = multer({ storage });

app.post("/reserva", upload.single("comprobante"), async (req, res) => {
  const { nombre, correo, cartones } = req.body;
  const archivo = req.file;

  if (!nombre || !correo || !cartones || !archivo) {
    return res.status(400).send("Faltan datos");
  }

  const client = await pool.connect();
  try {
    await client.query(
      "INSERT INTO reservas (nombre, correo, cartones, comprobante, aprobado) VALUES ($1, $2, $3, $4, false)",
      [nombre, correo, cartones, archivo.filename]
    );
    await client.release();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "Nueva reserva recibida",
      html: `<p><strong>Nombre:</strong> ${nombre}</p>
             <p><strong>Correo:</strong> ${correo}</p>
             <p><strong>Cartones:</strong> ${cartones}</p>`,
      attachments: [
        {
          filename: archivo.originalname,
          path: archivo.path,
        },
      ],
    });

    res.send("Reserva recibida correctamente");
  } catch (err) {
    await client.release();
    console.error(err);
    res.status(500).send("Error al guardar la reserva");
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});

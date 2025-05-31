
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("railway.app")
    ? { rejectUnauthorized: false }
    : false,
});

// Configurar multer para archivos
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Ruta para recibir usuarios y comprobantes
app.post("/api/users", upload.single("proof"), async (req, res) => {
  try {
    const { name, email, count } = req.body;
    const proofFile = req.file;

    // Guardar en la base de datos
    await pool.query(
      "INSERT INTO reservas (nombre, correo, cartones, comprobante, aprobado, fecha) VALUES ($1, $2, $3, $4, $5, NOW())",
      [name, email, count, proofFile?.originalname || null, false]
    );

    // Enviar correo
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "Nuevo registro - Bingos Dany",
      html: `<p><strong>Nombre:</strong> ${name}</p>
             <p><strong>Correo:</strong> ${email}</p>
             <p><strong>Cantidad de cartones:</strong> ${count}</p>`,
      attachments: proofFile
        ? [
            {
              filename: proofFile.originalname,
              content: proofFile.buffer,
            },
          ]
        : [],
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Correo enviado y datos guardados correctamente." });
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    res.status(500).json({ error: "Error al enviar el correo o guardar en la base de datos." });
  }
});

// Ruta para obtener todas las reservas
app.get("/api/reservas", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM reservas ORDER BY fecha DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    res.status(500).json({ error: "Error al obtener reservas" });
  }
});

// Ruta para aprobar una reserva
app.post("/api/reservas/aprobar/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE reservas SET aprobado = true WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error al aprobar reserva:", error);
    res.status(500).json({ error: "Error al aprobar reserva" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

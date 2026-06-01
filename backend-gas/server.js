require('dotenv').config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const multer = require("multer");
const fs = require("fs");
const PDFDocument = require('pdfkit');
const archiver = require('archiver');

const app = express();

app.use(cors());
app.use(express.json());

// Servir archivos estáticos de la carpeta uploads
app.use('/uploads', express.static('uploads'));

// Asegurar que la carpeta uploads exista
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "empresa_gas"
});

db.connect(err => {
  if (err) {
    console.log(err);
  } else {
    console.log("Conectado a MySQL");
  }
});

// Configurar el transporter de nodemailer
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Usar SSL para el puerto 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // Permite conexiones aunque el certificado local no sea validado
  }
});

// Verificar conexión del transporter al iniciar
transporter.verify((error, success) => {
  if (error) {
    console.error('Error verificando transporter de correo:', error);
  } else {
    console.log('Servidor listo para enviar correos.');
  }
});

const recoveryCodes = {};

function generarCodigoVerificacion() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function limpiarCodigoRecuperacion(email) {
  delete recoveryCodes[email];
}

// Función auxiliar para generar contraseña aleatoria
function generarPassword(longitud = 8) {
  const caracteres = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$";
  let password = "";
  for (let i = 0; i < longitud; i++) {
    password += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return password;
}

function validarPassword(password) {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
  return true;
}

app.post("/registro", (req, res) => {

  const { nombre, apellido, email, password, fechaNacimiento, genero, telefono } = req.body;

  if (!telefono) {
    return res.status(400).send("El número de teléfono es obligatorio.");
  }

  // Verificar si el email ya existe
  const checkSql = "SELECT * FROM usuarios WHERE email = ?";
  db.query(checkSql, [email], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error en el servidor");
    } else if (result.length > 0) {
      res.status(400).send("El email ya está registrado");
    } else {
      // Insertar el nuevo usuario
      const insertSql = "INSERT INTO usuarios (nombre, apellido, email, password, fecha_nacimiento, genero, telefono) VALUES (?,?,?,?,?,?,?)";
      db.query(insertSql, [nombre, apellido, email, password, fechaNacimiento, genero, telefono], (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send("Error al registrar usuario");
        } else {
          // Enviar email de bienvenida
          const mailOptions = {
            from: process.env.EMAIL_USER || "",
            to: email,
            subject: "¡Bienvenido a Paisa Gas!",
            html: `
              <h2>¡Hola ${nombre}!</h2>
              <p>Tu registro ha sido completado exitosamente.</p>
              <p>Acabas de registrarte en la página de <strong>Paisa Gas</strong>.</p>
              <p>Detalles de tu cuenta:</p>
              <ul>
                <li><strong>Nombre:</strong> ${nombre} ${apellido}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Teléfono:</strong> ${telefono}</li>
                <li><strong>Fecha de Nacimiento:</strong> ${fechaNacimiento}</li>
              </ul>
              <p>Si no realizaste este registro, por favor contacta con nosotros inmediatamente.</p>
              <p>Gracias por confiar en nosotros.</p>
              <br>
              <p><em>Equipo de Paisa Gas</em></p>
            `
          };

          transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
              console.log("Error al enviar email:", err);
              res.status(500).send("Usuario registrado pero hubo un error al enviar el email");
            } else {
              console.log("Email enviado:", info.response);
              res.send("Usuario registrado exitosamente. Revisa tu email para confirmar.");
            }
          });
        }
      });
    }
  });
});
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  console.log("Login request recibida:", email, password);
  const sql = "SELECT * FROM usuarios WHERE email = ?";
  db.query(sql, [email], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Error en el servidor." });
    } else if (result.length > 0) {
      const usuario = result[0];
      
      if (password === usuario.password) {
        console.log("Resultado MySQL:", result);
        return res.json({
          success: true,
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            fechaNacimiento: usuario.fecha_nacimiento,
            genero: usuario.genero,
            telefono: usuario.telefono,
            prefijo: usuario.prefijo,
            pais: usuario.pais
          }
        });
      } else {
        return res.status(401).json({ error: "Contraseña incorrecta." });
      }
    } else {
      return res.status(404).json({ error: "Usuario no registrado. Por favor, regístrese." });
    }
  });
});

app.post("/cambiar-password", (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  if (!email || !currentPassword || !newPassword) {
    return res.status(400).send("Todos los campos son requeridos.");
  }

  // 1. Validar la nueva contraseña
  if (!validarPassword(newPassword)) {
    return res.status(400).send("La nueva contraseña no cumple con los requisitos de seguridad (mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial).");
  }

  // 2. Verificar que el usuario y la contraseña actual son correctos
  const checkSql = "SELECT * FROM usuarios WHERE email = ? AND password = ?";
  db.query(checkSql, [email, currentPassword], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Error en el servidor.");
    }
    if (result.length === 0) {
      return res.status(401).send("La contraseña actual es incorrecta.");
    }

    const usuario = result[0];

    // 3. Si son correctos, actualizar la contraseña
    const updateSql = "UPDATE usuarios SET password = ? WHERE email = ?";
    db.query(updateSql, [newPassword, email], (updateErr, updateResult) => {
      if (updateErr) {
        console.log(updateErr);
        return res.status(500).send("Error al actualizar la contraseña.");
      }

      // 4. Enviar correo de confirmación
      const mailOptions = {
        from: process.env.EMAIL_USER || "dairoalbertoqh@gmail.com",
        to: email,
        subject: "Confirmación de Cambio de Contraseña - Paisa Gas",
        html: `
          <h2>Cambio de Contraseña Exitoso</h2>
          <p>Hola ${usuario.nombre},</p>
          <p>Te confirmamos que tu contraseña ha sido cambiada exitosamente.</p>
          <p>Si no realizaste este cambio, por favor contacta con nuestro equipo de soporte inmediatamente.</p>
          <br>
          <p><em>Equipo de Paisa Gas</em></p>
        `
      };

      transporter.sendMail(mailOptions, (mailErr, info) => { /* No hacemos nada si falla, la contraseña ya se cambió */ });

      return res.send("Contraseña actualizada exitosamente.");
    });
  });
});

app.post("/recuperar-password", (req, res) => {
  const emailRaw = req.body.email;
  const email = emailRaw ? emailRaw.toLowerCase().trim() : '';
  const codigoVerificacion = req.body.codigoVerificacion ? req.body.codigoVerificacion.toString().trim() : null;
  const newPassword = req.body.newPassword;

  if (!email) {
    return res.status(400).send("El correo electrónico es obligatorio.");
  }

  const checkSql = "SELECT * FROM usuarios WHERE email = ?";
  db.query(checkSql, [email], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Error en el servidor.");
    }
    if (result.length === 0) {
      return res.status(404).send("El correo electrónico no se encuentra registrado.");
    }

    const usuario = result[0];

    // Si se proporcionó un código, estamos en el proceso de VERIFICAR y CAMBIAR la contraseña
    if (codigoVerificacion !== null) {
      const recoveryEntry = recoveryCodes[email];
      if (!recoveryEntry) {
        return res.status(401).send("No hay un código pendiente. Solicita uno nuevo.");
      }

      if (recoveryEntry.expiresAt < Date.now()) {
        limpiarCodigoRecuperacion(email);
        return res.status(401).send("El código ha expirado.");
      }

      if (recoveryEntry.codigo.toString().trim() !== codigoVerificacion.toString().trim()) {
        return res.status(401).send("Código incorrecto.");
      }

      if (!newPassword) {
        return res.status(400).send("Debes ingresar la nueva contraseña.");
      }

      if (!validarPassword(newPassword)) {
        return res.status(400).send("La nueva contraseña no cumple los requisitos de seguridad.");
      }

      const updateSql = "UPDATE usuarios SET password = ? WHERE id = ?";
      db.query(updateSql, [newPassword, usuario.id], (updateErr, updateResult) => {
        if (updateErr) {
          console.error("Error al actualizar password:", updateErr);
          return res.status(500).send("Error al actualizar en la base de datos.");
        }

        limpiarCodigoRecuperacion(email);

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: usuario.email,
          subject: "Confirmación: Cambio de contraseña exitoso - Paisa Gas",
          html: `
            <h2>Contraseña Actualizada</h2>
            <p>Hola ${usuario.nombre},</p>
            <p>Te informamos que tu contraseña ha sido actualizada correctamente.</p>
            <p>Si no realizaste este cambio, contacta a soporte técnico de inmediato.</p>
            <br><p><em>Equipo de Paisa Gas</em></p>`
        };

        transporter.sendMail(mailOptions);

        return res.send("Contraseña actualizada exitosamente.");
      });
    } 
    // Si NO se proporcionó código, asumimos que es una SOLICITUD inicial de un nuevo código
    else {
      const codigo = generarCodigoVerificacion();
      const expiresAt = Date.now() + 15 * 60 * 1000;
      recoveryCodes[email] = { codigo, expiresAt };

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Tu código de recuperación - Paisa Gas",
        html: `
          <h2>Recuperación de Contraseña</h2>
          <p>Hola ${usuario.nombre},</p>
          <p>Tu código de seguridad es:</p>
          <h2 style="color: #007bff;">${codigo}</h2>
          <p>Este código es válido por 15 minutos.</p>
          <br><p><em>Equipo de Paisa Gas</em></p>`
      };

      transporter.sendMail(mailOptions, (mailErr) => {
        if (mailErr) {
          console.error("Error enviando código:", mailErr);
          return res.status(500).send("Error al enviar el correo.");
        }
        res.send("Se ha enviado un código de verificación a tu correo.");
      });
    }
  });
});

app.get("/facturas", (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).send("Se requiere el ID del usuario.");
  }

  const sql = "SELECT * FROM facturas WHERE usuario_id = ? ORDER BY fecha DESC";
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Error al obtener facturas.");
    }
    res.json(result);
  });
});

app.post("/comprar", (req, res) => {
  const { userId, producto, cantidad, tamanio, subtotal, iva, descuento, total, promocion } = req.body;

  if (!userId || !producto || !cantidad || !tamanio || !total) {
    return res.status(400).send("Todos los campos son requeridos.");
  }

  const sql = "INSERT INTO facturas (usuario_id, producto, cantidad, tamanio, subtotal, iva, descuento, total, fecha, promocion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)";
  db.query(sql, [userId, producto, cantidad, tamanio, subtotal, iva, descuento, total, promocion], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Error al guardar la factura.");
    }
    res.send("Compra realizada exitosamente.");
  });
});

app.delete("/facturas/:id", (req, res) => {
  const id = req.params.id;
  console.log(`Intentando eliminar factura con ID: ${id}`);
  
  const sql = "DELETE FROM facturas WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar de la DB:", err);
      return res.status(500).send("Error al eliminar la factura.");
    }
    console.log("Factura eliminada correctamente");
    res.send("Factura eliminada exitosamente.");
  });
});

app.post("/quejas", (req, res) => {
  const { userId, tipo, mensaje } = req.body;

  if (!userId || !tipo || !mensaje) {
    return res.status(400).send("Todos los campos son requeridos.");
  }

  const sql = "INSERT INTO quejas (usuario_id, tipo, mensaje, fecha) VALUES (?, ?, ?, NOW())";
  db.query(sql, [userId, tipo, mensaje], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Error al guardar la queja.");
    }

    // 1. Respondemos inmediatamente al frontend para que el modal aparezca rápido
    res.send("Queja enviada exitosamente.");

    // 2. Procesamos la notificación por correo en segundo plano
    const userSql = "SELECT id, nombre, apellido, email FROM usuarios WHERE id = ?";
    db.query(userSql, [userId], (userErr, userResult) => {
      if (userErr) {
        console.error("Error SQL al buscar usuario:", userErr);
        return;
      }
      
      if (userResult.length === 0) {
        console.error("No se encontró el usuario con ID:", userId);
        return;
      }

      const usuario = userResult[0];
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `Nueva PQR: ${tipo.toUpperCase()} de ${usuario.nombre} ${usuario.apellido}`,
        replyTo: usuario.email,
        html: `
          <div style="font-family: Arial, sans-serif; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
            <h2 style="color: #007bff;">Nueva solicitud de PQR</h2>
            <p><strong>De:</strong> ${usuario.nombre} ${usuario.apellido} (${usuario.email})</p>
            <p><strong>Asunto:</strong> ${tipo.toUpperCase()}</p>
            <hr>
            <p><strong>Mensaje del cliente:</strong></p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; font-style: italic;">
              "${mensaje}"
            </div>
            <p>Atentamente, <br>Sistema de Notificaciones Paisa Gas</p>
          </div>`
      };

      transporter.sendMail(mailOptions, (mailErr, info) => {
        if (mailErr) console.error("Error enviando correo PQR:", mailErr);
        else console.log("Email PQR enviado con éxito:", info.response);
      });
    });
  });
});

app.get("/certificados", (req, res) => {
  const { userId } = req.query;
  console.log("Cargando certificados para el usuario:", userId);

  if (!userId) {
    return res.status(400).send("Se requiere el ID del usuario.");
  }

  const sql = "SELECT * FROM certificados WHERE usuario_id = ? ORDER BY fecha_subida DESC";
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("Error SQL al obtener certificados:", err);
      return res.status(500).send("Error al obtener certificados.");
    }
    res.json(result);
  });
});

app.post("/certificados", upload.single('archivo'), (req, res) => {
  const { userId, tipo } = req.body;
  const archivo = req.file ? req.file.filename : null;

  console.log("Intento de subida:", { userId, tipo, archivo });

  if (!userId || !tipo || !archivo) {
    return res.status(400).send(`Faltan datos: userId=${userId}, tipo=${tipo}, archivo=${archivo}`);
  }

  const sql = "INSERT INTO certificados (usuario_id, tipo, archivo, fecha_subida) VALUES (?, ?, ?, NOW())";
  db.query(sql, [userId, tipo, archivo], (err, result) => {
    if (err) {
      console.error("Error SQL al guardar el certificado:", err); // Log the specific database error
      return res.status(500).send("Error al guardar el certificado.");
    }
    res.send("Certificado subido exitosamente.");
  });
});

// Función para generar PDF
function fillPDFDocument(doc, data) { 
  // Encabezado
  doc.fontSize(20).text('Copia de Seguridad - Paisa Gas', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Fecha de generación: ${new Date().toLocaleString()}`, { align: 'right' });
  doc.moveDown();

  // Perfil
  doc.fontSize(16).text('Información de Perfil', { underline: true });
  doc.fontSize(12).text(`Nombre: ${data.usuario.nombre} ${data.usuario.apellido}`);
  doc.text(`Email: ${data.usuario.email}`);
  doc.text(`Teléfono: ${data.usuario.telefono}`);
  doc.moveDown();

  // Facturas
  doc.fontSize(16).text('Historial de Compras', { underline: true });
  data.historial_compras.forEach(f => {
    doc.fontSize(10).text(`Orden #${f.id} - ${f.fecha}: ${f.producto} (${f.tamanio}) - Total: $${f.total}`);
  });
  if (data.historial_compras.length === 0) doc.fontSize(10).text('No hay compras registradas.');
  doc.moveDown();

  // Certificados
  doc.fontSize(16).text('Certificados Subidos', { underline: true });
  data.documentos.forEach(c => {
    doc.fontSize(10).text(`Tipo: ${c.tipo} - Archivo: ${c.archivo}`);
  });
  if (data.documentos.length === 0) doc.fontSize(10).text('No hay certificados.');
  doc.moveDown();

  // PQR
  doc.fontSize(16).text('Quejas y Reclamos', { underline: true });
  data.peticiones_pqr.forEach(p => {
    doc.fontSize(10).text(`[${p.tipo}] ${p.fecha}: ${p.mensaje}`);
  });
  if (data.peticiones_pqr.length === 0) doc.fontSize(10).text('No hay mensajes.');

  doc.end();
}

// Función auxiliar para obtener PDF como Buffer
function obtenerPDFBuffer(data) { 
  return new Promise((resolve) => {
    const chunks = [];
    const doc = new PDFDocument();
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    fillPDFDocument(doc, data); 
  });
}

app.get("/backup-datos/:userId", (req, res) => {
  const { userId } = req.params;
  const queries = {
    perfil: "SELECT id, nombre, apellido, email, telefono FROM usuarios WHERE id = ?",
    facturas: "SELECT * FROM facturas WHERE usuario_id = ?",
    certificados: "SELECT * FROM certificados WHERE usuario_id = ?",
    quejas: "SELECT * FROM quejas WHERE usuario_id = ?"
  };

  const data = {};
  db.query(queries.perfil, [userId], (err, userRes) => {
    if (err || userRes.length === 0) return res.status(500).send("Error al obtener perfil");
    data.usuario = userRes[0];
    db.query(queries.facturas, [userId], (err, factRes) => {
      data.historial_compras = factRes;
      db.query(queries.certificados, [userId], (err, certRes) => {
        data.documentos = certRes;
        db.query(queries.quejas, [userId], (err, quejaRes) => {
          data.peticiones_pqr = quejaRes;

          const archive = archiver('zip', { zlib: { level: 9 } });
          res.setHeader('Content-Type', 'application/zip');
          res.setHeader('Content-Disposition', `attachment; filename="Backup_Paisa Gas_${data.usuario.nombre}.zip"`);
          archive.pipe(res);
          obtenerPDFBuffer(data).then(pdfBuffer => {
            archive.append(pdfBuffer, { name: 'Resumen_General.pdf' });

            // Agregar archivos de certificados al ZIP
            data.documentos.forEach(cert => {
              const filePath = `uploads/${cert.archivo}`;
              if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: `certificados/${cert.archivo}` });
              }
            });

            archive.finalize(); // Finalize the archiver
          });
        });
      });
    });
  });
});

app.post("/backup", (req, res) => {
  const { userId } = req.body;
  const queries = {
    perfil: "SELECT id, nombre, apellido, email, telefono FROM usuarios WHERE id = ?",
    facturas: "SELECT * FROM facturas WHERE usuario_id = ?",
    certificados: "SELECT * FROM certificados WHERE usuario_id = ?",
    quejas: "SELECT * FROM quejas WHERE usuario_id = ?"
  };

  const data = {};
  db.query(queries.perfil, [userId], (err, userRes) => {
    if (err || userRes.length === 0) return res.status(500).send("Error");
    data.usuario = userRes[0];
    db.query(queries.facturas, [userId], (err, factRes) => {
      data.historial_compras = factRes;
      db.query(queries.certificados, [userId], (err, certRes) => {
        data.documentos = certRes;
        db.query(queries.quejas, [userId], (err, quejaRes) => {
          data.peticiones_pqr = quejaRes;

          const archive = archiver('zip', { zlib: { level: 9 } });
          const chunks = [];
          archive.on('data', chunk => chunks.push(chunk));
          archive.on('end', () => {
            const zipBuffer = Buffer.concat(chunks);
            const mailOptions = {
              from: process.env.EMAIL_USER,
              to: data.usuario.email,
              subject: "Tu Copia de Seguridad - Paisa Gas",
              html: `<p>Hola ${data.usuario.nombre}, adjunto enviamos tu copia de seguridad completa (ZIP) con facturas y certificados.</p>`,
              attachments: [{ filename: `Copia_Seguridad_${data.usuario.nombre}.zip`, content: zipBuffer }]
            };
            transporter.sendMail(mailOptions, (mailErr) => {
              if (mailErr) return res.status(500).send("Error enviando email");
              res.send("Copia de seguridad enviada a tu correo.");
            });
          });

          // Construir el ZIP para el email
          obtenerPDFBuffer(data).then(pdfBuffer => {
            archive.append(pdfBuffer, { name: 'Resumen_General.pdf' });
            data.documentos.forEach(cert => {
              const filePath = `uploads/${cert.archivo}`;
              if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: `certificados/${cert.archivo}` });
              }
            });
            archive.finalize();
          });
        });
      });
    });
  });
});
app.listen(3000, () => {
  console.log("Servidor corriendo en puerto 3000");
});
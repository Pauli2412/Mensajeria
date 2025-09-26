// src/server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import adminRoutes from "./routes/admin.js";
import publicRoutes from "./routes/Public.js";
import cron from "node-cron";
import { syncSheets } from "./services/syncService.js"; 
import cors from "cors";
import chatRoutes from "./routes/chat.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Necesario para responder preflights
app.options("*", cors());


// ✅ monta las rutas primero
app.use("/admin", adminRoutes);
app.use("/", publicRoutes);
app.use("/", chatRoutes);


// prueba rápida
app.get("/ping", (req, res) => res.json({ ok: true, msg: "pong" }));


// si nada matchea, manda error (esto SIEMPRE va al final)
app.use((req, res) => {
  res.status(404).json({ 
    ok: false, 
    error: "Ruta no encontrada", 
    path: req.path, 
    method: req.method 
  });
});

const PORT = process.env.PORT || 5010;
app.listen(PORT, () => {
  console.log("Servidor en http://localhost:" + PORT);
});

cron.schedule('*/10 * * * *', async () => {
  try {
    await syncSheets();
  } catch (e) {
    console.error('❌ Error en syncSheets:', e);
  }
})



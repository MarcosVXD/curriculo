require('dotenv').config(); 

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;


const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


app.use(cors());
app.use(express.json());


const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos PDF são permitidos.'));
        }
    }
});


app.post('/api/curriculos', upload.single('pdf'), async (req, res) => {
    try {
        const nome = req.body.nome;

        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo PDF foi enviado.' });
        }
        if (!nome) {
            fs.unlinkSync(req.file.path); // Apaga o arquivo físico se faltar o nome
            return res.status(400).json({ error: 'O nome do candidato é obrigatório.' });
        }

        const query = 'INSERT INTO curriculos (nome, nome_arquivo, caminho_arquivo) VALUES (?, ?, ?)';
        const [result] = await pool.execute(query, [nome, req.file.filename, req.file.path]);

        console.log(' Novo currículo salvo! ID:', result.insertId);

        res.status(201).json({ 
            mensagem: 'Currículo enviado e salvo com sucesso!', 
            id: result.insertId
        });

    } catch (error) {
        console.error('Erro ao salvar no banco:', error);
        res.status(500).json({ error: 'Erro interno ao processar o banco de dados.' });
    }
});

app.get('/api/curriculos', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, nome, data_envio FROM curriculos ORDER BY data_envio DESC');
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar currículos:', error);
        res.status(500).json({ error: 'Erro interno ao buscar a lista de currículos.' });
    }
});

app.get('/api/curriculos/download/:id', async (req, res) => {
    try {
        const id = req.params.id;

        const query = 'SELECT nome_arquivo, caminho_arquivo FROM curriculos WHERE id = ?';
        const [rows] = await pool.execute(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Currículo não encontrado.' });
        }

        const curriculo = rows[0];
        const caminhoAbsoluto = path.resolve(curriculo.caminho_arquivo);

        if (!fs.existsSync(caminhoAbsoluto)) {
            return res.status(404).json({ error: 'O arquivo físico não foi encontrado no servidor.' });
        }

        res.download(caminhoAbsoluto, curriculo.nome_arquivo);

    } catch (error) {
        console.error('Erro ao baixar currículo:', error);
        res.status(500).json({ error: 'Erro interno ao processar o download.' });
    }
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'O arquivo excede o limite de 5MB.' });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
});


app.listen(PORT, async () => {
    try {
        await pool.getConnection();
        console.log(`Servidor rodando na porta ${PORT}`);
        console.log(`Conectado com sucesso ao banco de dados MySQL`);
    } catch (dbError) {
        console.error(' Falha ao conectar no banco de dados:', dbError.message);
        console.log('Verifique se o XAMPP/MySQL está rodando e se os dados no .env estão corretos.');
    }
});
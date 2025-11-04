

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs/promises'); // Usando promises para operações assíncronas
const axios = require('axios'); // Para baixar imagens de URL
const multer = require('multer');
const { createCanvas, loadImage } = require('canvas');

// Configuração do Multer (sem salvamento direto, apenas em memória, para processar o Jimp)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB
});

// Diretório onde as imagens finais serão salvas (ajuste conforme a estrutura do seu projeto)
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'imagens', 'produto');

// Middleware para garantir que o diretório de upload existe
router.use(async (req, res, next) => {
    try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        next();
    } catch (error) {
        console.error('Erro ao criar diretório de upload:', error);
        res.status(500).json({ error: 'Erro de configuração do servidor.' });
    }
});

// Rota para upload ou download de imagem
// ... (seu código antes do router.post)
// Certifique-se de ter importado { createCanvas, loadImage } do 'canvas'
//const { createCanvas, loadImage } = require('canvas'); 

// Rota para upload ou download de imagem
router.post('/upload-image', upload.single('imageFile'), async (req, res) => {
    console.log('Requisição recebida para /upload-image - Body:', req.body);

    const { produtoId, imageSource, imageUrl } = req.body;

    if (!produtoId) {
        return res.status(400).json({ message: 'ID do Produto é obrigatório.' });
    }

    let imageBuffer;

    try {
        if (imageSource === 'local' && req.file) {
            // Caso 1: Imagem enviada localmente
            imageBuffer = req.file.buffer;
            console.log('Imagem local recebida, tamanho:', imageBuffer.length, 'bytes');
            
        } else if (imageSource === 'url' && imageUrl) {
            // Caso 2: Imagem via URL
            console.log('Baixando imagem da URL:', imageUrl);
            const response = await axios.get(imageUrl, {
                responseType: 'arraybuffer'
            });
            imageBuffer = response.data;
            console.log('Imagem URL baixada, tamanho:', imageBuffer.length, 'bytes');
            
        } else {
            return res.status(400).json({ 
                message: 'Dados de imagem inválidos ou ausentes.',
                details: {
                    imageSource,
                    hasFile: !!req.file,
                    hasImageUrl: !!imageUrl
                }
            });
        }

        // Verificar se temos um buffer válido
        if (!imageBuffer || imageBuffer.length === 0) {
            return res.status(400).json({ message: 'Buffer de imagem vazio ou inválido.' });
        }

        // ------------------------------------------------------------------
        // ⭐ NOVO PASSO 1: Conversão para PNG usando Canvas
        // ------------------------------------------------------------------
      //  console.log('Iniciando conversão e processamento da imagem com canvas...');

        // 1. Carrega o buffer da imagem (JPG, GIF, etc.) em um objeto Image
        const image = await loadImage(imageBuffer);

        // 2. Cria um novo Canvas com as dimensões da imagem carregada
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        // 3. Desenha a imagem no Canvas (manipulação de pixels)
        ctx.drawImage(image, 0, 0, image.width, image.height);
        
        // 4. Obtém o novo buffer da imagem, forçando o formato PNG
        // toBuffer é assíncrono por padrão (ou pode ser chamado de forma síncrona, mas é melhor usar async)
        // O tipo padrão de toBuffer é 'image/png' (ou null), mas vamos ser explícitos.
        const pngBuffer = canvas.toBuffer('image/png');
        
      //  console.log('✅ Conversão para PNG concluída. Novo tamanho:', pngBuffer.length, 'bytes');
        // ------------------------------------------------------------------
        
        // Agora, trabalhamos com o buffer PNG recém-criado
        const finalBuffer = pngBuffer; 

     //   console.log('Salvando imagem diretamente...');
        
        // Determinar a extensão do arquivo
       
        const extensao = 'png'; 
        
        // Nome do arquivo final: produtoId.extensao
        const filename = `${produtoId}.${extensao}`;
        const finalPath = path.join(UPLOAD_DIR, filename);
        
        // Salvar o buffer PNG no arquivo
        await fs.writeFile(finalPath, finalBuffer);
        
      //  console.log('✅ Imagem salva com sucesso em:', finalPath);
      //  console.log('📁 Tamanho do arquivo:', finalBuffer.length, 'bytes');

        res.status(200).json({ 
            message: 'Imagem salva com sucesso!', 
            filename: filename,
            path: finalPath,
            size: finalBuffer.length,
            format: extensao.toUpperCase()
        });

    } catch (error) {
        // ... (seu tratamento de erro)
        console.error('❌ Erro ao processar imagem:', error);
        
        let errorMessage = 'Erro interno ao processar a imagem.';
        
        // Adiciona tratamento para erros do Canvas (erros de formato são comuns)
        if (error.message && error.message.includes('Invalid image source')) {
            errorMessage = 'Formato de imagem original não suportado pelo Canvas ou corrompido.';
        } else if (error.message && error.message.includes('404')) {
            errorMessage = 'URL de imagem não encontrada ou inacessível.';
        } else if (error.message && error.message.includes('ENOENT')) {
            errorMessage = 'Diretório de upload não existe.';
        } else if (error.message && error.message.includes('network') || error.code === 'ENOTFOUND') {
            errorMessage = 'Erro de rede - URL não pode ser acessada.';
        }
        
        res.status(500).json({ 
            message: errorMessage, 
            error: error.message,
            code: error.code
        });
    }
});

module.exports = router;

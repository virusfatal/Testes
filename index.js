const axios = require('axios');
var express = require('express'),
  cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const session = require('express-session');
const path = require('path');
const MemoryStore = require('memorystore')(session);
const fs = require('fs');
const { token } = require("./config.js");
const htmlPath = path.join(__dirname, './views/error.html');
const creator = "CM";
const Jimp = require('jimp');
const sharp = require('sharp');
const yts = require('yt-search');
const cheerio = require('cheerio');
const { AssemblyAI } = require('assemblyai');
const metadinhas = require('./links/metadinha.json');

const loghandler = {
  notparam: {
    status: false,
    criador: creator,
    codigo: 406,
    mensagem: 'Sem Saldo'
  },
  error: {
    status: false,
    criador: creator,
    codigo: 404,
    mensagem: '404 ERROR'
  }
};
var app = express()
app.enable('trust proxy');
app.set("json spaces", 2)
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 86400000 },
  store: new MemoryStore({
    checkPeriod: 86400000
  }),
}));
app.use(cors())
app.use(express.static("public"))
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'seuSegredo',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, 
  }
}));

mongoose.connect(token, { useNewUrlParser: true, useUnifiedTopology: true });
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  key: { type: String, required: true },
  saldo: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  ft: { type: String, default: null },
  yt: { type: String, default: null },
  zap: { type: String, default: null },
  insta: { type: String, default: null },
  wallpaper: { type: String, default: null },
  isAdm: { type: Boolean, default: false },
});

const User = mongoose.model('Lady', userSchema);
Person = User;
async function diminuirSaldo(username) {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return false;
    }
    if (user.isAdm) {
      console.log('Usuário premium ou administrador. Saldo não será diminuído.');
      return false;
    }

    if (user.saldo > 0) {
      user.saldo--;
      await user.save();
      return true;
    } else {
      return false; 
    }
  } catch (error) {
    console.error('Erro ao diminuir saldo:', error);
    return false;
  }
}

async function adicionarSaldo(username) {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return false;
    }
    user.total += 1;
    await user.save();
    return true;
  } catch (error) {
    console.error('Erro ao adicionar total:', error);
    return false;
  }
}

async function readUsers() {
  try {
    return await User.find();
  } catch (error) {
    console.error('Erro ao acessar o banco de dados:', error);
    return [];
  }
}

async function saveUsers(users) {
  try {
    await User.deleteMany();
    await User.insertMany(users);
  } catch (error) {
    console.error('Erro ao salvar os dados no banco de dados:', error);
  }
}



// ============== ROTAS DE CONFIGURACAO DA API ==============\\

app.get('/', async (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.redirect('/login');
  }
  const { username, password } = user;
  try {
    const userDb = await User.findOne({ username, password });
    const quantidadeRegistrados = await User.countDocuments();
    const topUsers = await User.find().sort({ saldo: -1 }).limit(5);
    return res.render('dashboard', { user, userDb, topUsers, quantidade: quantidadeRegistrados });
  } catch (error) {
    console.error('Erro ao processar a rota:', error);
    return res.status(500).send('Erro interno ao processar a rota.');
  }
});


app.get('/myperfil', async (req, res) => {
  const user = req.session.user;
  if (user) {
    const { username, password } = user;
      const userDb = await User.findOne({ username, password });
      const users = userDb;
      const quantidadeRegistrados = await User.countDocuments();
      const topUsers = await User.find().sort({ total: -1 }).limit(7);
      return res.render('myperfil', { user, userDb, users, topUsers, quantidade: quantidadeRegistrados });
}
});

app.get('/search', async (req, res) => {
  const searchTerm = req.query.search || '';
  try {
    const searchResults = await User.find({ username: { $regex: searchTerm, $options: 'i' } });
    return res.render('search', { searchTerm, searchResults });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return res.status(500).send('Erro interno do servidor. Por favor, tente novamente mais tarde.');
  }
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).send('Nome de usuário já existe. Por favor, escolha outro.');
    }
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const keycode = Math.floor(100000 + Math.random() * 900000).toString();
    const ft = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlEcOwa7TnrQ1uRihMsFmpIinyzREUXldvrLtrT_WbLRKV2_HUrT7xgLPd&s=10";
    const saldo = 100000; 
    const total = 0;
    const key = keycode;
    const insta = "@clovermods"
    const zap = "55"
    const yt = "youtube.com/@clovermods"
    const wallpaper = "https://telegra.ph/file/56fa53ec05377a51311cc.jpg"
    const user = new User({ username, password, email, key, saldo, total, ft, zap, insta, yt, wallpaper, isAdm: false });
    await user.save();
    console.log(user)
    req.session.user = user;
    res.redirect('/');

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao registrar usuário.' });
  }
});
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const senha = password
  const user = await User.findOne({ username });
  if (user) {
    try {
      if (user.password !== senha) {
        return res.status(401).send('Nome de usuário ou senha incorretos. Por favor, tente novamente.');
      }
      req.session.user = user;
      res.redirect('/');
    } catch (error) {
      console.error('Erro ao acessar o banco de dados:', error);
      return res.status(500).send('Erro interno do servidor. Por favor, tente novamente mais tarde.');
    }
  } else {
    res.status(401).json({ message: 'Usuário não encontrado.' });
  }

})

app.get('/admin', async (req, res) => {
  const user = req.session.user;
  if (user) {
    try {
      const isAdmin = await User.findOne({ _id: user._id, isAdm: true });
      if (isAdmin) {
        const users = await User.find();
        return res.render('adminDashboard', { users, user });
      } else {
        return res.sendFile(htmlPath);
      }
    } catch (error) {
      console.error('Erro ao acessar usuários:', error);
      return res.status(500).send('Erro interno do servidor. Por favor, tente novamente mais tarde.');
    }
  } else {
    return res.sendFile(htmlPath);
  }
});

app.get('/editar/:username', async (req, res) => {
  const { user: currentUser, senha: currentPassword } = req.session;
  const { username: targetUsername } = req.params;
  const specialKey = 'SUPREMnO';
  try {
    const user = await User.findOne({ username: targetUsername });
    if (!user) {
      return res.status(404).send('Usuário não encontrado.');
    }
    const isAdminOrSpecialUser = currentUser.isAdm || currentUser.key === specialKey;
    if (!isAdminOrSpecialUser && (user.key !== currentPassword || user.username !== currentUser.username)) {
      return res.status(401).send('Acesso não autorizado para editar.');
    }
    res.render('edit', { user });
  } catch (error) {
    console.error('Erro ao acessar o banco de dados:', error);
    return res.status(500).send('Erro interno do servidor. Por favor, tente novamente mais tarde.');
  }
});

app.get('/deletar/:username', async (req, res) => {
  const { user: currentUser, senha: currentPassword } = req.session;
  const { username: targetUsername } = req.params;
  const specialKey = 'clover';
  try {
    const user = await User.findOne({ username: targetUsername });
    if (!user) {
      return res.status(404).send('Usuário não encontrado.');
    }
    const isAdminOrSpecialUser = currentUser.isAdm || currentUser.key === specialKey;
    if (!isAdminOrSpecialUser && (user.key !== currentPassword || user.username !== currentUser.username)) {
      return res.status(401).send('Acesso não autorizado para deletar.');
    }
    await User.deleteOne({ username: targetUsername });
    res.redirect('/');
  } catch (error) {
    console.error('Erro ao acessar o banco de dados:', error);
    return res.status(500).send('Erro interno do servidor. Por favor, tente novamente mais tarde.');
  }
});


app.post('/edit/:username', async (req, res) => {
  const { username } = req.params;
  const { password, key, ft, saldo, total, isAdm } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send('Usuário não encontrado.');
    }
    const isAdmValue = isAdm === 'true';
    user.password = password || user.password;
    user.key = key || user.key;
    user.ft = ft || user.ft;
    user.saldo = saldo || user.saldo;
    user.isAdm = isAdmValue;
    user.total = total || user.total;
    await user.save();
    return res.redirect('/');
  } catch (error) {
    console.error('Erro ao acessar o banco de dados:', error);
    return res.status(500).send('Erro interno do servidor. Por favor, tente novamente mais tarde.');
  }
});


app.post('/editarr/:username', async (req, res) => {
  const { username } = req.params;
  const { password, key, ft, insta, wallpaper, zap, yt } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send('Usuário não encontrado.');
    }
    user.password = password || user.password;
    user.key = key || user.key;
    user.ft = ft || user.ft;
    user.yt = yt || user.yt;
    user.insta = insta || user.insta
    user.zap = zap || user.zap
    user.wallpaper = wallpaper || user.wallpaper
    await user.save();
    return res.redirect('/login');
  } catch (error) {
    console.error('Erro ao acessar o banco de dados:', error);
    return res.status(500).send('Erro interno do servidor. Por favor, tente novamente mais tarde.');
  }
});
// ============== ROTAS NORMAIS DA API ==============\\


// Constantes para APIs
const TMDB_API_KEY = '313071c73c4100a6996157af94de7207';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const ASSEMBLYAI_KEY = '286b8a431336478d8932ff40a0692271';
const assemblyaiClient = new AssemblyAI({ apiKey: ASSEMBLYAI_KEY });

// ============== ROTAS NORMAIS DA API ==============\\




app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Rota para buscar vídeos (exemplo de uso)
app.get('/pesquisa/:APIKEY', async (req, res) => {
  const user = await User.findOne({ key: req.params.APIKEY });
  if (!user || user.saldo <= 0) return res.status(401).json({ error: 'VERIFIQUE SUA API' });

  try {
    const { videos } = await yts(req.query.q);
    res.json(videos.map(({ title, url, duration, thumbnail }) => ({ title, url, duration: duration.timestamp, thumbnail })));
  } catch {
    res.status(500).json({ error: 'Erro na pesquisa' });
  }
});

app.get('/movie/:APIKEY', async (req, res) => {
  const user = await User.findOne({ key: req.params.APIKEY });
  if (!user || user.saldo <= 0) return res.status(401).json({ error: 'VERIFICA SUA API' });

  try {
    const { data } = await axios.get('https://api.themoviedb.org/3/search/movie', {
      params: { api_key: TMDB_API_KEY, query: req.query.q, language: 'pt-BR' }
    });
    const movie = data.results[0];
    if (!movie) return res.status(404).json({ error: 'Película no encontrada' });
    res.json({ title: movie.title, image: `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`, description: movie.overview, release_date: movie.release_date });
  } catch {
    res.status(500).json({ error: 'Error al buscar la película' });
  }
});

const numerosPossiveis = require('./link.js');
app.get('/memes/:APIKEY', async (req, res) => {
    const user = await User.findOne({ key: req.params.APIKEY });
    if (!user || user.saldo <= 0) return res.status(401).json({ error: 'Acesso negado' });    
    res.json({ meme: numerosPossiveis[Math.floor(Math.random() * numerosPossiveis.length)] });
    if (!user.isAdm) {
        user.saldo -= 1;
        await user.save();
    }
});
app.get('/xvideos/:API/search', async (req, res) => {
  const { API: key } = req.params;
  const { q, page = 1 } = req.query;
  const resultsPerPage = 5;

  try {
    const user = await User.findOne({ key });
    if (!user) return res.status(401).json({ error: 'Chave inválida' });
    if (user.saldo <= 0 && !user.isAdm) return res.status(402).json(loghandler.notparam);

    const searchUrl = `https://www.xvideos.com/?k=${encodeURIComponent(q)}&p=${page - 1}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.xvideos.com/',
        'Accept-Encoding': 'gzip, deflate, br'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const results = [];

    const videoBlocks = $('.mozaique .thumb-block');
    
    const videoProcessing = videoBlocks.map(async (i, el) => {
      try {
        const videoPath = $(el).find('.thumb a').attr('href');
        if (!videoPath) return null;

        const videoUrl = `https://www.xvideos.com${videoPath}`;
        const videoPage = await axios.get(videoUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': searchUrl
          },
          timeout: 20000
        });

        const $$ = cheerio.load(videoPage.data);
        
        // Nova extração do URL de download
        const scriptContent = $$('script:contains("html5player")').html();
        let downloadUrl = scriptContent?.match(/html5player\.setVideoUrlHigh\(\s*['"](.*?)['"]\s*\)/)?.[1];
        
        // Fallback caso não encontre
        if (!downloadUrl) {
          downloadUrl = scriptContent?.match(/html5player\.setVideoUrlLow\(\s*['"](.*?)['"]\s*\)/)?.[1];
        }
        
        // Último fallback para HLS
        if (!downloadUrl) {
          const configMatch = scriptContent?.match(/html5player\.setVideoHLS\(\s*['"](.*?)['"]\s*\)/);
          if (configMatch) {
            const m3u8Response = await axios.get(configMatch[1]);
            downloadUrl = m3u8Response.data.split('\n').find(line => line.endsWith('.mp4'));
          }
        }

        if (!downloadUrl) return null;

        return {
          title: $$('meta[property="og:title"]').attr('content'),
          url: videoUrl,
          duration: $$('.duration').text().trim(),
          thumb: $$('meta[property="og:image"]').attr('content'),
          download_url: downloadUrl
        };
      } catch (error) {
        console.error(`Erro no vídeo ${i + 1}:`, error.message);
        return null;
      }
    }).get();

    const rawResults = await Promise.all(videoProcessing);
    const validResults = rawResults.filter(item => item !== null);

    if (!user.isAdm) await diminuirSaldo(user.username);

    const startIndex = (page - 1) * resultsPerPage;
    const paginatedResults = validResults.slice(startIndex, startIndex + resultsPerPage);

    res.json({
      status: true,
      search_term: q,
      results: paginatedResults,
      total: validResults.length,
      page: parseInt(page),
      resultsPerPage
    });

  } catch (error) {
    console.error('Erro na pesquisa:', error.message);
    res.status(500).json({ 
      status: false, 
      error: 'Erro interno',
      details: error.message
    });
  } 
});

const PIXABAY_API_KEY = '49921681-9019e1d53abe4b8e8bbdc3ab7'; // Substitua pela sua chave

// Adicione esta rota junto com as outras rotas da API
app.get('/pixabay/:APIKEY/search', async (req, res) => {
    const { APIKEY } = req.params;
    const { q, category, min_width = 1920 } = req.query;
    
    try {
        const user = await User.findOne({ key: APIKEY });
        if (!user) return res.status(401).json({ error: 'Chave API inválida' });
        if (user.saldo <= 0 && !user.isAdm) return res.status(402).json(loghandler.notparam);

        const params = {
            key: PIXABAY_API_KEY,
            q: encodeURIComponent(q),
            lang: 'pt',
            image_type: 'photo',
            orientation: 'horizontal',
            min_width: min_width,
            per_page: 20,
            safesearch: true
        };

        if (category) params.category = category;

        const response = await axios.get('https://pixabay.com/api/', { params });
        
        const results = response.data.hits.map(image => ({
            url: image.largeImageURL,
            name: image.tags,
            user: image.user,
            views: image.views,
            likes: image.likes,
            downloads: image.downloads,
            resolution: `${image.imageWidth}x${image.imageHeight}`,
            type: image.type
        }));

        // Atualiza o saldo do usuário
        if (!user.isAdm) {
            user.saldo -= 1;
            await user.save();
        }

        res.json({
            status: true,
            search_term: q,
            total_results: response.data.totalHits,
            results: results
        });

    } catch (error) {
        console.error('Erro na busca de imagens:', error);
        const statusCode = error.response?.status || 500;
        res.status(statusCode).json({
            status: false,
            error: 'Erro na busca de imagens',
            details: error.response?.data || error.message
        });
    }
});


app.get('/intoxianime/:APIKEY/search', async (req, res) => {
  const { APIKEY } = req.params;
  const { q, page = 1 } = req.query;

  try {
    // Verificação do usuário
    const user = await User.findOne({ key: APIKEY });
    if (!user) return res.status(401).json({ error: 'Chave API inválida' });
    if (user.saldo <= 0 && !user.isAdm) return res.status(402).json(loghandler.notparam);

    // Configurar a URL de busca
    const searchUrl = `https://www.intoxianime.com/page/${page}/?s=${encodeURIComponent(q)}`;
    
    // Fazer a requisição
    const { data } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9'
      }
    });

    // Parsear o HTML
    const $ = cheerio.load(data);
    const results = [];

    // Extrair as notícias
    $('article').each((index, element) => {
      const title = $(element).find('h2.entry-title').text().trim();
      const link = $(element).find('h2.entry-title a').attr('href');
      const image = $(element).find('div.post-thumbnail img').attr('src');
      const excerpt = $(element).find('div.entry-summary p').text().trim();
      const date = $(element).find('time.entry-date').attr('datetime');

      if (title && link) {
        results.push({
          title,
          link,
          image: image || null,
          excerpt: excerpt || null,
          date: date || null,
          tags: $(element).find('div.entry-categories a').map((i, el) => $(el).text()).get()
        });
      }
    });

    // Atualizar saldo
    if (!user.isAdm) await diminuirSaldo(user.username);

    res.json({
      status: true,
      search_term: q,
      current_page: parseInt(page),
      results_count: results.length,
      results
    });

  } catch (error) {
    console.error('Erro na busca:', error);
    res.status(500).json({
      status: false,
      error: 'Erro ao buscar notícias',
      details: error.message
    });
  }
});

app.get('/e-hentai/:APIKEY', async (req, res) => {
  const { APIKEY } = req.params;
  const searchTerm = req.query.q || '';

  try {
    // Verificação do usuário
    const user = await User.findOne({ key: APIKEY });
    if (!user) return res.status(401).json({ error: 'Chave API inválida' });
    if (user.saldo <= 0 && !user.isAdm) return res.status(402).json(loghandler.notparam);

    // Monta a URL de pesquisa para e-hentai
    const searchUrl = `https://e-hentai.org/?f_search=${encodeURIComponent(searchTerm)}`;

    // Faz a requisição para a URL de pesquisa
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9'
      }
    });

    // Processamento do HTML...
    const $ = cheerio.load(response.data);
    const results = [];

    $('.glink').each((index, element) => {
      const titleElement = $(element);
      const title = titleElement.text().trim();
      const link = titleElement.closest('a').attr('href');
      const tags = titleElement.siblings('.gt').map((i, el) => $(el).attr('title')).get();

      results.push({
        title,
        link,
        tags,
      });
    });

    const totalResultsText = $('.searchtext p').text();
    const totalResultsMatch = totalResultsText.match(/Found ([\d,]+) results/);
    const totalResults = totalResultsMatch ? totalResultsMatch[1] : '0';

    // Atualizar saldo do usuário
    if (!user.isAdm) {
      user.saldo -= 1;
      await user.save();
    }

    res.json({
      status: true,
      searchTerm,
      results,
      total: parseInt(totalResults.replace(/,/g, ''), 10),
    });

  } catch (error) {
    console.error('Erro ao buscar no e-hentai:', error);
    res.status(500).json({ 
      status: false, 
      error: 'Erro ao buscar no e-hentai',
      details: error.message
    });
  }
});



// Montagem

app.get('/anime/:APIKEY', async (req, res) => {
    const { APIKEY } = req.params;
    const { 
        teks,
        gradiente = 'fogo',
        cor = 'FF0000',
        cor2,
        posX = 'center',
        posY = 10,
        fonte = 'futura',
        curvatura = 10,
        direcao = 'cima'
    } = req.query;

    try {
        // ===================== VERIFICAÇÕES INICIAIS =====================
        const isLocalhost = APIKEY === 'localhost';
        const user = isLocalhost ? { isAdm: true } : await User.findOne({ key: APIKEY });
        
        if (!user) return res.status(401).json({ error: '🔑 Chave inválida' });
        if (user.saldo <= 0 && !user.isAdm) return res.status(402).json(loghandler.notparam);
        if (!teks) return res.status(400).json({ error: '📝 Texto obrigatório' });

        // ===================== CONFIGURAÇÃO DE CURVATURA =====================
        const curveIntensity = Math.min(Math.max(curvatura, 0), 100);
        const curveDirection = direcao === 'cima' ? -1 : 1;

        // ===================== BIBLIOTECA DE GRADIENTES =====================
        const gradientMaster = {
            // Venom Series
            'venom-1': ['FF0023', '00FF47'],
            'venom-2': ['8B0000', 'FF2400'],
            'venom-3': ['40E0D0', '00FF00'],
            
            // Neon Tech
            'neon-1': ['FF00FF', '00FFFF'],
            'neon-2': ['FF0000', 'FFFF00'],
            'neon-3': ['00FF00', '000000'],
            
            // Nature Elements
            'nature-1': ['000080', '00CED1'],
            'nature-2': ['228B22', '006400'],
            'nature-3': ['FF4500', 'FFD700'],
            
            // Complex Gradients
            'arcoiris': ['FF0000', 'FFA500', 'FFFF00', '00FF00', '00FFFF', '0000FF', '8A2BE2'],
            'brasil': ['009C3B', 'FFDF00', '002776'],
            'fogo': ['FF0000', 'FF8C00', 'FFD700']
        };

        // ===================== CONFIGURAÇÃO DE CORES =====================
        let cores = [];
        if (gradiente && gradientMaster[gradiente]) {
            cores = gradientMaster[gradiente];
        } else if (cor && cor2) {
            cores = [cor, cor2];
        } else {
            cores = [cor];
        }

        const parseColor = (hex) => {
            try {
                return Jimp.intToRGBA(Jimp.cssColorToHex(`#${hex}`));
            } catch {
                return Jimp.intToRGBA(0xFFFFFFFF); // Fallback para branco
            }
        };

        const coresRGBA = cores.map(parseColor);

        // ===================== PROCESSAMENTO DA IMAGEM =====================
        const bg = await Jimp.read('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSN1oNTSqejk602bqB-LlRl-QdcZ5-hMSTU9HmjivwSPitZYoWJNt302G6a&s=10');
        
        // Configurar fonte
        const fontMap = {
            sans: Jimp.FONT_SANS_32_BLACK,
            script: Jimp.FONT_SANS_16_BLACK,
            futura: Jimp.FONT_SANS_64_BLACK
        };
        const font = await Jimp.loadFont(fontMap[fonte] || fontMap.sans);

        // ===================== SISTEMA DE CURVATURA =====================
        const chars = teks.toUpperCase().split('');
        const charWidths = chars.map(c => Jimp.measureText(font, c));
        const totalWidth = charWidths.reduce((a, b) => a + b, 0);

        // Calcular posição base
        let startX = typeof posX === 'number' ? posX : 
                    posX === 'left' ? 20 : 
                    posX === 'right' ? bg.bitmap.width - totalWidth - 20 : 
                    (bg.bitmap.width - totalWidth) / 2;

        const baseY = (bg.bitmap.height * posY) / 100;

        // Criar camada de texto
        const textLayer = new Jimp(bg.bitmap.width, bg.bitmap.height, 0x00000000);

        // Aplicar curvatura
        chars.forEach((char, index) => {
            const t = (index / (chars.length - 1 || 1)) * Math.PI;
            const yOffset = curveIntensity * curveDirection * Math.sin(t);
            
            textLayer.print(
                font,
                startX,
                baseY + yOffset - 25, // Ajuste central vertical
                char
            );
            
            startX += charWidths[index];
        });

        // ===================== APLICAÇÃO DO GRADIENTE =====================
        textLayer.scan(0, 0, textLayer.bitmap.width, textLayer.bitmap.height, (x, y, idx) => {
            if (textLayer.bitmap.data[idx + 3] > 0) {
                if (coresRGBA.length === 1) {
                    textLayer.bitmap.data.set([
                        coresRGBA[0].r,
                        coresRGBA[0].g,
                        coresRGBA[0].b,
                        255
                    ], idx);
                } else {
                    const totalCores = coresRGBA.length;
                    const percent = x / textLayer.bitmap.width;
                    const step = percent * (totalCores - 1);
                    const index = Math.min(Math.floor(step), totalCores - 2);
                    const peso = step - index;
                    
                    const cor1 = coresRGBA[index];
                    const cor2 = coresRGBA[index + 1];
                    
                    const r = cor1.r + (cor2.r - cor1.r) * peso;
                    const g = cor1.g + (cor2.g - cor1.g) * peso;
                    const b = cor1.b + (cor2.b - cor1.b) * peso;
                    
                    textLayer.bitmap.data.set([r, g, b, 255], idx);
                }
            }
        });

        // ===================== MODO DESENVOLVEDOR =====================
        if (isLocalhost) {
            const debugFont = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
            
            // Overlay de informações
            bg.print(debugFont, 10, 10, 
                `X:${startX} | Y:${baseY} | Curv:${curveIntensity}%` + 
                `\nDir:${direcao} | Cores:${cores.join('-')}`
            );

            // Grade de referência
            for (let x = 0; x < bg.bitmap.width; x += 50) {
                for (let y = 0; y < bg.bitmap.height; y++) {
                    if (x % 250 === 0) bg.setPixelColor(0xFF00FF33, x, y);
                }
            }
        }

        // Composição final
        bg.composite(textLayer, 0, 0);

        // Atualizar saldo
        if (!user.isAdm) await diminuirSaldo(user.username);

        // Enviar resposta
        res.set('Content-Type', 'image/jpeg');
        res.send(await bg.quality(90).getBufferAsync(Jimp.MIME_JPEG));

    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ 
            status: false,
            error: 'Falha na geração',
            details: error.message
        }); 
    }
});

//YT 


app.get('/plaq/:APIKEY', async (req, res) => {
    const { APIKEY } = req.params;
    const { 
        texto,
        gradiente = 'aco_escovado',
        cor1 = '000000',
        cor2,
        posX = '750',
        posY = '600',
        fonte = 'fino',
        curvatura = '35',
        direcao = 'cima',
        opacidade = '50' // Novo parâmetro
    } = req.query;

    try {
        // ===================== VERIFICAÇÕES =====================
        const user = await User.findOne({ key: APIKEY });
        if (!user) return res.status(401).json({ error: 'Chave inválida' });
        if (!texto) return res.status(400).json({ error: 'Texto obrigatório' });

        // ===================== CONFIGURAÇÃO DE OPACIDADE =====================
        const numOpacidade = Math.min(Math.max(parseInt(opacidade), 0), 100);
        const alpha = Math.round((numOpacidade / 100) * 255);

        // ===================== PALETA OTIMIZADA =====================
        const paleta = {
            // Tons de Preto
            'preto_solido': ['000000'],
            'preto_degrade': ['000000', '333333'],
            'carvao_solido': ['1A1A1A'],
            'carvao_degrade': ['2D2D2D', '1A1A1A', '080808'],
            
            // Tons Especiais
            'grafite_puro': ['2D2D2D'],
            'aco_escovado': ['2D2926'],
            'nevoa_ferro': ['262626']
        };

        // ===================== CONVERSOR DE CORES =====================
        const converterCor = (hex) => {
            const hexLimpo = hex.replace('#', '').padStart(6, '0');
            return parseInt(`0x${hexLimpo}00`, 16); // Alpha será controlado separadamente
        };

        // ===================== CARREGAMENTO DE RECURSOS =====================
        const [bg, font] = await Promise.all([
            Jimp.read('imagens/plaq.jpg'),
            Jimp.loadFont({
                padrao: Jimp.FONT_SANS_64_BLACK,
                fino: Jimp.FONT_SANS_128_WHITE,
                grande: Jimp.FONT_SANS_128_BLACK
            }[fonte])
        ]);

        // ===================== PROCESSAMENTO DO TEXTO =====================
        const textLayer = new Jimp(bg.bitmap.width, bg.bitmap.height, 0x00000000);
        const chars = texto.toUpperCase().split('');
        const metricas = chars.map(c => Jimp.measureText(font, c));

        // Configurações numéricas
        const numPosX = Number(posX.replace(/[^0-9.-]/g, '')) || 0;
        const numPosY = Number(posY.replace(/[^0-9.-]/g, '')) || 0;
        const curva = Math.min(Math.max(Number(curvatura), 0), 100);

        // Aplicar curvatura
        let xAtual = numPosX;
        chars.forEach((char, i) => {
            const angulo = (i / chars.length) * Math.PI;
            const deslocamento = curva * (direcao === 'cima' ? -1 : 1) * Math.sin(angulo);
            
            textLayer.print(
                font,
                xAtual,
                numPosY + deslocamento,
                char
            );
            
            xAtual += metricas[i];
        });

        // ===================== APLICAÇÃO DE CORES E OPACIDADE =====================
        const coresSelecionadas = paleta[gradiente] || [cor1];
        const coresConvertidas = coresSelecionadas.map(converterCor);

        textLayer.scan(0, 0, textLayer.bitmap.width, textLayer.bitmap.height, (x, y, idx) => {
            if (textLayer.bitmap.data[idx + 3] > 0) {
                if (coresConvertidas.length === 1) {
                    const cor = coresConvertidas[0];
                    textLayer.bitmap.data.set([
                        (cor >> 24) & 0xFF,  // Vermelho
                        (cor >> 16) & 0xFF,  // Verde
                        (cor >> 8) & 0xFF,   // Azul
                        alpha                // Opacidade aplicada
                    ], idx);
                } else {
                    const passo = x / textLayer.bitmap.width;
                    const index = Math.floor(passo * (coresConvertidas.length - 1));
                    const progresso = passo * (coresConvertidas.length - 1) - index;

                    const corInicial = coresConvertidas[index];
                    const corFinal = coresConvertidas[Math.min(index + 1, coresConvertidas.length - 1)];

                    const r = Math.round(((corInicial >> 24) & 0xFF) + (((corFinal >> 24) & 0xFF) - ((corInicial >> 24) & 0xFF)) * progresso);
                    const g = Math.round(((corInicial >> 16) & 0xFF) + (((corFinal >> 16) & 0xFF) - ((corInicial >> 16) & 0xFF)) * progresso);
                    const b = Math.round(((corInicial >> 8) & 0xFF) + (((corFinal >> 8) & 0xFF) - ((corInicial >> 8) & 0xFF)) * progresso);

                    textLayer.bitmap.data.set([r, g, b, alpha], idx);
                }
            }
        });

        // ===================== SAÍDA FINAL =====================
        bg.composite(textLayer, 0, 0);
        res.type('png').send(await bg.getBufferAsync(Jimp.MIME_PNG));

    } catch (error) {
        res.status(500).json({ 
            status: false,
            error: 'Erro na geração',
            detalhes: error.message
        });
    }
});

// Rota para metadinha aleatória
app.get('/metadinha/:APIKEY', async (req, res) => {
    const { APIKEY } = req.params;
    
    try {
        const user = await User.findOne({ key: APIKEY });
        if (!user) return res.status(401).json({ error: 'Chave API inválida' });
        if (user.saldo <= 0 && !user.isAdm) return res.status(402).json(loghandler.notparam);
        const indiceAleatorio = Math.floor(Math.random() * metadinhas.length);
        const metadinhaSelecionada = metadinhas[indiceAleatorio];
        const response = {
            status: true,
            number: metadinhaSelecionada.number,
            male: metadinhaSelecionada.male,
            female: metadinhaSelecionada.female
        };
        if (!user.isAdm) {
            user.saldo -= 1;
            await user.save();
        }
        res.json(response);
    } catch (error) {
        console.error('Erro na geração da metadinha:', error);
        res.status(500).json({
            status: false,
            error: 'Erro interno no servidor',
            details: error.message
        });
    }
});
app.get('/reddit/nsfw/:APIKEY', async (req, res) => {
    const { APIKEY } = req.params;
    const { q, limit = 15 } = req.query;

    try {
        if (!(await User.findOne({ key: APIKEY }))) {
            return res.status(401).json({ error: "Chave API inválida" });
        }

        const response = await axios.get('https://www.reddit.com/search.json', {
            params: {
                q: `${q} (nsfw:yes) (url:.jpg OR url:.png)`,
                sort: 'new',
                t: 'all',
                limit: 100,
                include_over_18: 1,
                raw_json: 1
            },
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const urls = response.data.data.children
            .map(post => post.data.url
                .replace('preview.', 'i.')
                .split('?')[0]
            )
            .filter(url => /\.(jpg|jpeg|png|webp)$/i.test(url))
            .slice(0, limit);

        const result = {};
        urls.forEach((url, index) => {
            result[`url${index + 1}`] = url;
        });

        res.json({
            search: q,
            count: urls.length,
            ...result
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/reddit/safe/:APIKEY', async (req, res) => {
    const { APIKEY } = req.params;
    const { q, limit = 15 } = req.query;

    try {
        // Verificação da chave
        if (!(await User.exists({ key: APIKEY }))) {
            return res.status(401).json({ error: "API Key inválida" });
        }

        // Busca livre com filtro NSFW estrito
        const response = await axios.get('https://www.reddit.com/search.json', {
            params: {
                q: `${q} (nsfw:no) (url:.jpg OR url:.png OR url:.webp)`,
                sort: 'relevance',
                t: 'all',
                limit: 100,
                include_over_18: 0, // Bloqueio duplo
                raw_json: 1
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.reddit.com/'
            }
        });

        // Processamento otimizado
        const safeUrls = response.data.data.children
            .filter(post => {
                // Verificação tripla de segurança
                const isNSFW = post.data.over_18 || 
                              /nsfw/i.test(post.data.title) || 
                              /nsfw/i.test(post.data.subreddit);
                return !isNSFW;
            })
            .map(post => {
                const cleanUrl = new URL(post.data.url);
                cleanUrl.search = ''; // Remove parâmetros
                return cleanUrl.href
                    .replace('preview.redd.it', 'i.redd.it')
                    .replace('&amp;', '&');
            })
            .filter(url => /\.(jpe?g|png|webp)$/i.test(url))
            .slice(0, limit);

        // Construção dinâmica do JSON
        const result = {
            query: q,
            safe_search: true,
            count: safeUrls.length
        };
        safeUrls.forEach((url, index) => {
            result[`url${index + 1}`] = url;
        });

        res.json(result);

    } catch (error) {
        res.status(500).json({ 
            error: "Erro na busca segura",
            details: error.message
        });
    }
});
const ytdl = require('@distube/ytdl-core');

// ============== ROTA DE ÁUDIO CORRIGIDA ==============\\

app.get('/play-audio/:APIKEY', async (req, res) => {
    const { APIKEY } = req.params;
    const { q } = req.query;

    try {
        // Verificação do usuário
        const user = await User.findOne({ key: APIKEY });
        if (!user) return res.status(401).json({ error: '🔑 Chave inválida' });
        if (user.saldo <= 0 && !user.isAdm) return res.status(402).json(loghandler.notparam);
        if (!q) return res.status(400).json({ error: '🔍 Parâmetro de pesquisa obrigatório' });

        // Buscar vídeo no YouTube
        const { videos } = await yts(q);
        if (!videos?.length) return res.status(404).json({ error: '❌ Nenhum vídeo encontrado' });

        // Obter informações do primeiro vídeo
        const video = videos[0];
        const info = await ytdl.getInfo(video.videoId);

        // Filtrar e selecionar melhor formato de áudio
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly')
            .filter(f => f.audioBitrate)
            .sort((a, b) => b.audioBitrate - a.audioBitrate);

        if (!audioFormats.length) return res.status(404).json({ error: '🔇 Formato de áudio não encontrado' });

        const bestAudio = audioFormats[0];

        // Atualizar saldo
        if (!user.isAdm) await diminuirSaldo(user.username);

        res.json({
            status: true,
            title: video.title,
            duration: video.duration.timestamp,
            thumbnail: video.thumbnail,
            audio_url: bestAudio.url,
            format: bestAudio.container,
            bitrate: bestAudio.audioBitrate,
            codec: bestAudio.audioCodec
        });

    } catch (error) {
        console.error('Erro no download de áudio:', error);
        res.status(500).json({
            status: false,
            error: '🎧 Erro ao processar áudio',
            details: error.message
        });
    }
});

// ============== ROTA DE VÍDEO CORRIGIDA ==============\\

app.get('/play-video/:APIKEY', async (req, res) => {
    const { APIKEY } = req.params;
    const { q, quality = 'highest' } = req.query;

    try {
        // Verificação do usuário
        const user = await User.findOne({ key: APIKEY });
        if (!user) return res.status(401).json({ error: '🔑 Chave inválida' });
        if (user.saldo <= 0 && !user.isAdm) return res.status(402).json(loghandler.notparam);
        if (!q) return res.status(400).json({ error: '🔍 Parâmetro de pesquisa obrigatório' });

        // Buscar vídeo no YouTube
        const { videos } = await yts(q);
        if (!videos?.length) return res.status(404).json({ error: '❌ Nenhum vídeo encontrado' });

        // Obter informações do primeiro vídeo
        const video = videos[0];
        const info = await ytdl.getInfo(video.videoId);

        // Sistema inteligente de seleção de qualidade
        const getBestFormat = () => {
            const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
            
            // Priorizar MP4 com áudio
            const mp4WithAudio = formats.filter(f => 
                f.container === 'mp4' && 
                f.qualityLabel &&
                f.hasAudio
            );

            // Se pedir qualidade específica
            if (quality !== 'highest') {
                const requestedQuality = mp4WithAudio
                    .filter(f => f.qualityLabel === quality)
                    .sort((a, b) => parseInt(b.qualityLabel) - parseInt(a.qualityLabel));

                if (requestedQuality.length) return requestedQuality[0];
            }

            // Ordenar por melhor qualidade
            return mp4WithAudio.sort((a, b) => 
                parseInt(b.qualityLabel) - parseInt(a.qualityLabel)
            )[0] || formats[0];
        };

        const bestFormat = getBestFormat();
        if (!bestFormat) return res.status(404).json({ error: '📹 Formato de vídeo não encontrado' });

        // Atualizar saldo
        if (!user.isAdm) await diminuirSaldo(user.username);

        res.json({
            status: true,
            title: video.title,
            duration: video.duration.timestamp,
            thumbnail: video.thumbnail,
            video_url: bestFormat.url,
            quality: bestFormat.qualityLabel || 'desconhecida',
            format: bestFormat.container,
            resolution: bestFormat.width && bestFormat.height 
                ? `${bestFormat.width}x${bestFormat.height}`
                : 'desconhecida'
        });

    } catch (error) {
        console.error('Erro no download de vídeo:', error);
        res.status(500).json({
            status: false,
            error: '🎥 Erro ao processar vídeo',
            details: error.message
        });
    }
});
// ============== ROTAS NORMAIS DA API ==============\\

app.listen(3219, 3000, 8080, 80, () => {
  console.log("Server rodando: http://0.0.0.0:3219")
})

module.exports = app
/* @CLOVERMYT */
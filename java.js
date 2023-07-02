const apiKey = 's9y8uhkwNuuPyJvXG74EJAEPlTlUxU252fXwSSU1jpIBIV4s6MVaT7FS';
const perPage = 20; // Número de resultados por página
const newSearchInput = document.getElementById('new-search-input');
const newSearchButton = document.getElementById('new-search-button');

let currentPage = 1; // Página atual
let currentQuery = ''; // Pesquisa atual

const gallery = document.querySelector('.gallery');
let loading = false; // Flag para evitar múltiplas requisições

// Função para carregar mais imagens correspondentes à pesquisa
async function loadMoreImages() {
  if (loading) return; // Se já estiver carregando, não faz nada
  loading = true;

  try {
    const response = await fetch(`https://api.pexels.com/v1/search?query=${currentQuery}&page=${currentPage + 1}&per_page=${perPage}`, {
      headers: {
        Authorization: apiKey
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar imagens');
    }

    const data = await response.json();
    const images = data.photos;

    // Adiciona as novas imagens à galeria
    images.forEach(image => {
      const imgElement = document.createElement('img');
      imgElement.src = image.src.large2x;
      imgElement.alt = image.url;
      const galleryItem = document.createElement('div');
      galleryItem.classList.add('gallery-item');
      galleryItem.appendChild(imgElement);
      gallery.appendChild(galleryItem);
    });

    currentPage++;
    loading = false;
  } catch (error) {
    console.log(error);
    loading = false;
  }
}

// Função para pesquisar imagens
function searchImages() {
  const query = newSearchInput.value.trim();

  if (query === '') {
    return;
  }

  gallery.innerHTML = ''; // Limpa a galeria
  currentPage = 1; // Reinicia a página atual
  currentQuery = query; // Define a pesquisa atual

  loadMoreImages(); // Carrega as primeiras imagens correspondentes à pesquisa
}

// Função para capturar o evento de teclado
function handleKeyPress(event) {
  if (event.key === 'Enter') {
    searchImages(); // Chama a função de pesquisa ao pressionar a tecla "Enter"
  }
}

// Adiciona o evento de teclado ao campo de entrada de texto
newSearchInput.addEventListener('keypress', handleKeyPress);

// Adiciona o evento de clique ao botão de pesquisa
newSearchButton.addEventListener('click', searchImages);

// Evento de rolagem
window.addEventListener('scroll', handleScroll);

// Função para criar o botão de download
function createDownloadButton(imageUrl) {
  const downloadBtn = document.createElement('button');
  downloadBtn.classList.add('download-btn');
  downloadBtn.textContent = 'Download';

  // Adiciona o evento de clique ao botão de download
  downloadBtn.addEventListener('click', () => {
    // Cria um link temporário para download
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'image.jpg';
    link.target = '_blank';

    // Simula o clique no link para iniciar o download
    link.click();
  });

  return downloadBtn;
}

// Função para adicionar eventos de mouse à imagem
function addImageEvents(imageElement, imageUrl) {
  const downloadBtn = createDownloadButton(imageUrl);

  // Cria o contêiner para envolver a imagem e o botão de download
  const imageContainer = document.createElement('div');
  imageContainer.classList.add('image-container');

  imageElement.addEventListener('mouseover', () => {
    // Mostra o botão de download quando o mouse está sobre a imagem
    downloadBtn.style.opacity = 1;
  });

  imageElement.addEventListener('mouseout', () => {
    // Esconde o botão de download quando o mouse sai da imagem
    downloadBtn.style.opacity = 0;
  });

  // Adiciona a imagem e o botão de download ao contêiner
  imageContainer.appendChild(imageElement);
  imageContainer.appendChild(downloadBtn);

  // Adiciona o contêiner à galeria
  gallery.appendChild(imageContainer);
}

// Função para lidar com a rolagem da página
function handleScroll() {
  const { scrollTop, clientHeight, scrollHeight } = document.documentElement;

  if (scrollTop + clientHeight >= scrollHeight - 10) {
    loadMoreImages();
  }
}

// Seletor para os links do menu
const menuLinks = document.querySelectorAll('.header ul li a');

// Função para lidar com o clique nos links do menu
function handleMenuClick(event) {
  // Previne o comportamento padrão do link (redirecionar para outra página)
  event.preventDefault();

  // Remove a classe "active" de todos os links do menu
  menuLinks.forEach(link => {
    link.classList.remove('active');
  });

  // Adiciona a classe "active" ao link clicado
  event.target.classList.add('active');

  // Aqui você pode adicionar o código para executar a ação correspondente ao link clicado, como mostrar conteúdo relacionado à aba selecionada ou navegar para outra página.
}

// Adiciona o evento de clique a todos os links do menu
menuLinks.forEach(link => {
  link.addEventListener('click', handleMenuClick);
});
// Adicione esse trecho ao seu javascript
const navbarToggle = document.getElementById('navbarToggle');
const navbarMenu = document.getElementById('navbarMenu');

navbarToggle.addEventListener('click', () => {
  navbarMenu.classList.toggle('show');
});

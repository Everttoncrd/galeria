// ======================================================
// CONFIGURAÇÃO
// ======================================================

const API_URL =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
        ? "http://127.0.0.1:5000/api/images"
        : "/api/images";

const PER_PAGE = 20;

const FAVORITES_STORAGE_KEY =
    "viageiros-favorites";


// ======================================================
// ELEMENTOS
// ======================================================

const gallery =
    document.getElementById("gallery");

const searchForm =
    document.getElementById("searchForm");

const searchInput =
    document.getElementById("new-search-input");

const categoryButtons =
    document.querySelectorAll(".category");

const galleryTitle =
    document.getElementById("galleryTitle");

const resultsInfo =
    document.getElementById("resultsInfo");

const statusMessage =
    document.getElementById("statusMessage");

const loader =
    document.getElementById("loader");

const scrollSentinel =
    document.getElementById("scrollSentinel");

const backToTop =
    document.getElementById("backToTop");


// MENU

const navbarToggle =
    document.getElementById("navbarToggle");

const navbarMenu =
    document.getElementById("navbarMenu");

const favoritesNav =
    document.getElementById("favoritesNav");

const favoritesCount =
    document.getElementById("favoritesCount");


// MODAL

const imageModal =
    document.getElementById("imageModal");

const modalImage =
    document.getElementById("modalImage");

const modalPhotographer =
    document.getElementById("modalPhotographer");

const modalOriginal =
    document.getElementById("modalOriginal");

const modalClose =
    document.getElementById("modalClose");

const modalBackdrop =
    document.querySelector(".modal-backdrop");


// ======================================================
// ESTADO
// ======================================================

let currentQuery = "travel";

let currentPage = 1;

let loading = false;

let hasMoreImages = true;

let currentView = "explore";

let favorites = loadFavorites();

let visiblePhotos = [];

let currentModalIndex = -1;

let requestController = null;

let requestVersion = 0;


// ======================================================
// FAVORITOS / LOCAL STORAGE
// ======================================================

function loadFavorites() {

    try {

        const savedFavorites =
            localStorage.getItem(
                FAVORITES_STORAGE_KEY
            );

        if (!savedFavorites) {
            return [];
        }

        const parsedFavorites =
            JSON.parse(savedFavorites);

        return Array.isArray(parsedFavorites)
            ? parsedFavorites
            : [];

    } catch (error) {

        console.error(
            "Erro ao carregar favoritos:",
            error
        );

        return [];
    }
}


function saveFavorites() {

    try {

        localStorage.setItem(
            FAVORITES_STORAGE_KEY,
            JSON.stringify(favorites)
        );

    } catch (error) {

        console.error(
            "Erro ao salvar favoritos:",
            error
        );
    }

    updateFavoritesCount();
}


function updateFavoritesCount() {

    if (favoritesCount) {
        favoritesCount.textContent =
            favorites.length;
    }
}


function isFavorite(photoId) {

    return favorites.some(
        (photo) =>
            String(photo.id) ===
            String(photoId)
    );
}


function toggleFavorite(photo) {

    const alreadyFavorite =
        isFavorite(photo.id);

    if (alreadyFavorite) {

        favorites =
            favorites.filter(
                (favorite) =>
                    String(favorite.id) !==
                    String(photo.id)
            );

    } else {

        favorites.unshift({

            id: photo.id,

            alt:
                photo.alt || "",

            photographer:
                photo.photographer ||
                "Fotógrafo desconhecido",

            photographer_url:
                photo.photographer_url || "#",

            url:
                photo.url || "#",

            src: {

                medium:
                    photo.src?.medium || "",

                large:
                    photo.src?.large || "",

                large2x:
                    photo.src?.large2x ||
                    photo.src?.large ||
                    ""

            }

        });
    }

    saveFavorites();

    if (currentView === "favorites") {

        renderFavorites();

    } else {

        updateFavoriteButtons();
        updateModalFavoriteButton();
    }
}


function updateFavoriteButtons() {

    const buttons =
        document.querySelectorAll(
            ".favorite-button"
        );

    buttons.forEach(
        (button) => {

            const photoId =
                button.dataset.photoId;

            const favorite =
                isFavorite(photoId);

            button.textContent =
                favorite
                    ? "♥"
                    : "♡";

            button.classList.toggle(
                "active",
                favorite
            );

            button.setAttribute(
                "aria-label",
                favorite
                    ? "Remover dos favoritos"
                    : "Adicionar aos favoritos"
            );
        }
    );
}


// ======================================================
// VISUALIZAÇÃO DE FAVORITOS
// ======================================================

function showFavorites() {

    currentView =
        "favorites";

    if (requestController) {
        requestController.abort();
    }

    hideLoader();
    hideStatus();

    favoritesNav?.classList.add(
        "active"
    );

    clearActiveCategories();

    galleryTitle.textContent =
        "Meus favoritos";

    renderFavorites();

    scrollToGallery();
}


function renderFavorites() {

    gallery.innerHTML = "";

    hideStatus();

    visiblePhotos = [
        ...favorites
    ];

    if (favorites.length === 0) {

        gallery.innerHTML = `
            <div class="favorites-empty">

                <span class="favorites-empty-icon">
                    ♡
                </span>

                <h3>
                    Nenhuma imagem favorita
                </h3>

                <p>
                    Explore a galeria e clique no
                    coração para salvar suas
                    fotografias favoritas.
                </p>

            </div>
        `;

        resultsInfo.textContent =
            "Você ainda não salvou nenhuma imagem";

        return;
    }

    renderImages(
        favorites
    );

    resultsInfo.textContent =
        `${favorites.length} ${
            favorites.length === 1
                ? "imagem salva"
                : "imagens salvas"
        }`;
}


function activateExploreView() {

    currentView =
        "explore";

    favoritesNav?.classList.remove(
        "active"
    );

    hideStatus();
}


// ======================================================
// API
// ======================================================

async function fetchImages(
    query,
    page = 1,
    signal
) {

    const params =
        new URLSearchParams({

            query,

            page,

            per_page:
                PER_PAGE

        });

    const response =
        await fetch(
            `${API_URL}?${params.toString()}`,
            {
                signal
            }
        );

    let data;

    try {

        data =
            await response.json();

    } catch {

        throw new Error(
            "O servidor retornou uma resposta inválida."
        );
    }

    if (!response.ok) {

        throw new Error(
            data.error ||
            `Erro ao carregar imagens (${response.status}).`
        );
    }

    return data;
}


// ======================================================
// SKELETON
// ======================================================

function showSkeletons(amount = 8) {

    gallery.innerHTML = "";

    const fragment =
        document.createDocumentFragment();

    for (
        let index = 0;
        index < amount;
        index++
    ) {

        const skeleton =
            document.createElement("div");

        skeleton.className =
            "skeleton-item";

        fragment.appendChild(
            skeleton
        );
    }

    gallery.appendChild(
        fragment
    );
}


function removeSkeletons() {

    const skeletons =
        gallery.querySelectorAll(
            ".skeleton-item"
        );

    skeletons.forEach(
        (skeleton) => {

            skeleton.remove();

        }
    );
}


// ======================================================
// CARREGAR IMAGENS
// ======================================================

async function loadImages({
    reset = false
} = {}) {

    if (currentView !== "explore") {
        return;
    }

    if (loading && !reset) {
        return;
    }

    if (
        !hasMoreImages &&
        !reset
    ) {
        return;
    }


    if (reset) {

        if (requestController) {
            requestController.abort();
        }

        requestController =
            new AbortController();

        requestVersion++;

        currentPage = 1;

        hasMoreImages = true;

        visiblePhotos = [];

        showSkeletons();

    } else if (!requestController) {

        requestController =
            new AbortController();
    }


    const thisRequestVersion =
        requestVersion;

    loading = true;

    hideStatus();

    showLoader();


    try {

        const data =
            await fetchImages(
                currentQuery,
                currentPage,
                requestController.signal
            );


        if (
            thisRequestVersion !==
            requestVersion
        ) {
            return;
        }


        if (
            currentView !==
            "explore"
        ) {
            return;
        }


        const photos =
            Array.isArray(data.photos)
                ? data.photos
                : [];


        if (reset) {

            removeSkeletons();

            gallery.innerHTML =
                "";

        }


        if (
            photos.length === 0 &&
            currentPage === 1
        ) {

            gallery.innerHTML =
                "";

            showStatus(
                `Nenhuma imagem encontrada para "${currentQuery}".`
            );

            resultsInfo.textContent =
                "Tente pesquisar outro termo.";

            hasMoreImages = false;

            return;
        }


        visiblePhotos.push(
            ...photos
        );


        renderImages(
            photos
        );


        if (
            typeof data.total_results ===
            "number"
        ) {

            resultsInfo.textContent =
                `${data.total_results.toLocaleString(
                    "pt-BR"
                )} imagens encontradas`;

        } else {

            resultsInfo.textContent =
                "Explore os resultados encontrados.";
        }


        if (
            !data.next_page ||
            photos.length < PER_PAGE
        ) {

            hasMoreImages = false;
        }


        currentPage++;


    } catch (error) {

        if (
            error.name ===
            "AbortError"
        ) {
            return;
        }

        console.error(error);

        removeSkeletons();


        if (
            currentView !==
            "explore"
        ) {
            return;
        }


        if (reset) {

            gallery.innerHTML =
                "";
        }


        showStatus(
            error.message ||
            "Ocorreu um erro ao carregar as imagens."
        );

        resultsInfo.textContent =
            "Não foi possível carregar os resultados.";


    } finally {

        if (
            thisRequestVersion ===
            requestVersion
        ) {

            loading = false;

            hideLoader();
        }
    }
}


// ======================================================
// RENDERIZAR IMAGENS
// ======================================================

function renderImages(photos) {

    const fragment =
        document.createDocumentFragment();

    photos.forEach(
        (photo, index) => {

            const item =
                createGalleryItem(
                    photo
                );

            item.style.animationDelay =
                `${Math.min(
                    index * 35,
                    350
                )}ms`;

            fragment.appendChild(
                item
            );
        }
    );

    gallery.appendChild(
        fragment
    );
}


// ======================================================
// CRIAR CARD
// ======================================================

function createGalleryItem(photo) {

    const article =
        document.createElement(
            "article"
        );

    article.className =
        "gallery-item";

    article.tabIndex =
        0;

    article.dataset.photoId =
        photo.id;

    article.setAttribute(
        "aria-label",
        `Fotografia de ${
            photo.photographer ||
            "fotógrafo desconhecido"
        }`
    );


    // IMAGEM

    const image =
        document.createElement(
            "img"
        );

    image.src =
        photo.src?.large ||
        photo.src?.medium ||
        "";

    image.alt =
        photo.alt ||
        `Fotografia de ${
            photo.photographer ||
            "fotógrafo desconhecido"
        }`;

    image.loading =
        "lazy";

    image.decoding =
        "async";


    // FAVORITO

    const favoriteButton =
        document.createElement(
            "button"
        );

    favoriteButton.className =
        "favorite-button";

    favoriteButton.type =
        "button";

    favoriteButton.dataset.photoId =
        photo.id;

    const favorite =
        isFavorite(
            photo.id
        );

    favoriteButton.textContent =
        favorite
            ? "♥"
            : "♡";

    favoriteButton.classList.toggle(
        "active",
        favorite
    );

    favoriteButton.setAttribute(
        "aria-label",
        favorite
            ? "Remover dos favoritos"
            : "Adicionar aos favoritos"
    );

    favoriteButton.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            toggleFavorite(
                photo
            );
        }
    );


    // OVERLAY

    const overlay =
        document.createElement(
            "div"
        );

    overlay.className =
        "image-overlay";


    const photographer =
        document.createElement(
            "span"
        );

    photographer.className =
        "photographer";

    photographer.textContent =
        photo.photographer ||
        "Fotógrafo desconhecido";


    const viewText =
        document.createElement(
            "span"
        );

    viewText.className =
        "view-image";

    viewText.textContent =
        "Visualizar fotografia";


    overlay.append(
        photographer,
        viewText
    );


    article.append(
        image,
        favoriteButton,
        overlay
    );


    // CLIQUE

    article.addEventListener(
        "click",
        () => {

            openModal(
                photo
            );
        }
    );


    // ACESSIBILIDADE POR TECLADO

    article.addEventListener(
        "keydown",
        (event) => {

            if (
                event.target !==
                article
            ) {
                return;
            }

            if (
                event.key ===
                    "Enter" ||
                event.key ===
                    " "
            ) {

                event.preventDefault();

                openModal(
                    photo
                );
            }
        }
    );


    return article;
}


// ======================================================
// PESQUISA
// ======================================================

searchForm.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();

        const query =
            searchInput.value.trim();

        if (!query) {
            return;
        }

        activateExploreView();

        currentQuery =
            query;

        galleryTitle.textContent =
            `Resultados para "${query}"`;

        clearActiveCategories();

        loadImages({
            reset: true
        });

        scrollToGallery();
    }
);


// ======================================================
// CATEGORIAS
// ======================================================

categoryButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                const query =
                    button.dataset.query;

                if (!query) {
                    return;
                }

                activateExploreView();

                currentQuery =
                    query;

                searchInput.value =
                    "";

                clearActiveCategories();

                button.classList.add(
                    "active"
                );

                galleryTitle.textContent =
                    button.textContent.trim();

                loadImages({
                    reset: true
                });

                scrollToGallery();
            }
        );
    }
);


function clearActiveCategories() {

    categoryButtons.forEach(
        (button) => {

            button.classList.remove(
                "active"
            );
        }
    );
}


// ======================================================
// BOTÃO FAVORITOS
// ======================================================

favoritesNav.addEventListener(
    "click",
    () => {

        showFavorites();

        navbarMenu.classList.remove(
            "show"
        );

        navbarToggle.setAttribute(
            "aria-expanded",
            "false"
        );
    }
);


// ======================================================
// MODAL
// ======================================================

function getPhotoIndex(photo) {

    return visiblePhotos.findIndex(
        (item) =>
            String(item.id) ===
            String(photo.id)
    );
}


function openModal(photo) {

    currentModalIndex =
        getPhotoIndex(
            photo
        );

    updateModal(
        photo
    );

    imageModal.classList.add(
        "open"
    );

    imageModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

    modalClose.focus();
}


function updateModal(photo) {

    if (!photo) {
        return;
    }

    modalImage.src =
        photo.src?.large2x ||
        photo.src?.large ||
        "";

    modalImage.alt =
        photo.alt ||
        `Fotografia de ${
            photo.photographer ||
            "fotógrafo desconhecido"
        }`;

    modalPhotographer.textContent =
        photo.photographer ||
        "Fotógrafo desconhecido";

    modalOriginal.href =
        photo.url || "#";

    updateModalFavoriteButton();
}


function closeModal() {

    imageModal.classList.remove(
        "open"
    );

    imageModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );

    modalImage.src =
        "";

    currentModalIndex =
        -1;
}


function showPreviousPhoto() {

    if (
        visiblePhotos.length === 0
    ) {
        return;
    }

    currentModalIndex =
        currentModalIndex <= 0
            ? visiblePhotos.length - 1
            : currentModalIndex - 1;

    updateModal(
        visiblePhotos[
            currentModalIndex
        ]
    );
}


function showNextPhoto() {

    if (
        visiblePhotos.length === 0
    ) {
        return;
    }

    currentModalIndex =
        currentModalIndex >=
        visiblePhotos.length - 1
            ? 0
            : currentModalIndex + 1;

    updateModal(
        visiblePhotos[
            currentModalIndex
        ]
    );
}


function updateModalFavoriteButton() {

    const modalFavorite =
        document.getElementById(
            "modalFavorite"
        );

    if (
        !modalFavorite ||
        currentModalIndex < 0 ||
        !visiblePhotos[
            currentModalIndex
        ]
    ) {
        return;
    }

    const photo =
        visiblePhotos[
            currentModalIndex
        ];

    const favorite =
        isFavorite(
            photo.id
        );

    modalFavorite.textContent =
        favorite
            ? "♥"
            : "♡";

    modalFavorite.classList.toggle(
        "active",
        favorite
    );

    modalFavorite.setAttribute(
        "aria-label",
        favorite
            ? "Remover dos favoritos"
            : "Adicionar aos favoritos"
    );
}


modalClose.addEventListener(
    "click",
    closeModal
);


modalBackdrop.addEventListener(
    "click",
    closeModal
);


const modalPrevious =
    document.getElementById(
        "modalPrevious"
    );

const modalNext =
    document.getElementById(
        "modalNext"
    );

const modalFavorite =
    document.getElementById(
        "modalFavorite"
    );


if (modalPrevious) {

    modalPrevious.addEventListener(
        "click",
        showPreviousPhoto
    );
}


if (modalNext) {

    modalNext.addEventListener(
        "click",
        showNextPhoto
    );
}


if (modalFavorite) {

    modalFavorite.addEventListener(
        "click",
        () => {

            if (
                currentModalIndex < 0
            ) {
                return;
            }

            const photo =
                visiblePhotos[
                    currentModalIndex
                ];

            if (!photo) {
                return;
            }

            toggleFavorite(
                photo
            );

            updateModalFavoriteButton();
        }
    );
}


document.addEventListener(
    "keydown",
    (event) => {

        if (
            !imageModal.classList.contains(
                "open"
            )
        ) {
            return;
        }

        if (
            event.key ===
            "Escape"
        ) {

            closeModal();

        } else if (
            event.key ===
            "ArrowLeft"
        ) {

            showPreviousPhoto();

        } else if (
            event.key ===
            "ArrowRight"
        ) {

            showNextPhoto();
        }
    }
);


// ======================================================
// LOADER
// ======================================================

function showLoader() {

    if (
        currentView ===
        "explore"
    ) {

        loader.hidden =
            false;
    }
}


function hideLoader() {

    loader.hidden =
        true;
}


// ======================================================
// STATUS
// ======================================================

function showStatus(message) {

    statusMessage.textContent =
        message;

    statusMessage.classList.add(
        "show"
    );
}


function hideStatus() {

    statusMessage.textContent =
        "";

    statusMessage.classList.remove(
        "show"
    );
}


// ======================================================
// INFINITE SCROLL
// ======================================================

const observer =
    new IntersectionObserver(
        (entries) => {

            const entry =
                entries[0];

            if (
                entry.isIntersecting &&
                currentView ===
                    "explore" &&
                !loading &&
                hasMoreImages
            ) {

                loadImages();
            }
        },
        {
            root: null,

            rootMargin:
                "500px 0px",

            threshold: 0
        }
    );


if (scrollSentinel) {

    observer.observe(
        scrollSentinel
    );
}


// ======================================================
// MENU MOBILE
// ======================================================

navbarToggle.addEventListener(
    "click",
    () => {

        const isOpen =
            navbarMenu.classList.toggle(
                "show"
            );

        navbarToggle.setAttribute(
            "aria-expanded",
            String(isOpen)
        );
    }
);


document
    .querySelectorAll(
        ".navbar-menu a"
    )
    .forEach(
        (link) => {

            link.addEventListener(
                "click",
                () => {

                    navbarMenu.classList.remove(
                        "show"
                    );

                    navbarToggle.setAttribute(
                        "aria-expanded",
                        "false"
                    );
                }
            );
        }
    );


// ======================================================
// SCROLL PARA GALERIA
// ======================================================

function scrollToGallery() {

    const gallerySection =
        document.getElementById(
            "galeria"
        );

    if (!gallerySection) {
        return;
    }

    setTimeout(
        () => {

            gallerySection.scrollIntoView({
                behavior:
                    "smooth",

                block:
                    "start"
            });
        },
        100
    );
}


// ======================================================
// VOLTAR AO TOPO
// ======================================================

window.addEventListener(
    "scroll",
    () => {

        if (!backToTop) {
            return;
        }

        if (
            window.scrollY >
            600
        ) {

            backToTop.classList.add(
                "show"
            );

        } else {

            backToTop.classList.remove(
                "show"
            );
        }
    },
    {
        passive: true
    }
);


if (backToTop) {

    backToTop.addEventListener(
        "click",
        () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    );
}


// ======================================================
// INICIALIZAÇÃO
// ======================================================

async function init() {

    updateFavoritesCount();

    galleryTitle.textContent =
        "Explore imagens";

    await loadImages({
        reset: true
    });
}


init();
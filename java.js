// ======================================================
// CONFIGURAÇÃO
// ======================================================

// TEMPORÁRIO.
// Coloque sua chave da Pexels aqui.
// NÃO publique a chave no GitHub.
const API_URL =
    "http://127.0.0.1:5000/api/images";

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
    document.getElementById(
        "new-search-input"
    );

const categoryButtons =
    document.querySelectorAll(
        ".category"
    );

const galleryTitle =
    document.getElementById(
        "galleryTitle"
    );

const resultsInfo =
    document.getElementById(
        "resultsInfo"
    );

const statusMessage =
    document.getElementById(
        "statusMessage"
    );

const loader =
    document.getElementById(
        "loader"
    );

const scrollSentinel =
    document.getElementById(
        "scrollSentinel"
    );

const backToTop =
    document.getElementById(
        "backToTop"
    );


// ======================================================
// MENU
// ======================================================

const navbarToggle =
    document.getElementById(
        "navbarToggle"
    );

const navbarMenu =
    document.getElementById(
        "navbarMenu"
    );

const favoritesNav =
    document.getElementById(
        "favoritesNav"
    );

const favoritesCount =
    document.getElementById(
        "favoritesCount"
    );


// ======================================================
// MODAL
// ======================================================

const imageModal =
    document.getElementById(
        "imageModal"
    );

const modalImage =
    document.getElementById(
        "modalImage"
    );

const modalPhotographer =
    document.getElementById(
        "modalPhotographer"
    );

const modalOriginal =
    document.getElementById(
        "modalOriginal"
    );

const modalClose =
    document.getElementById(
        "modalClose"
    );

const modalBackdrop =
    document.querySelector(
        ".modal-backdrop"
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

const modalCounter =
    document.getElementById(
        "modalCounter"
    );

const modalDescription =
    document.getElementById(
        "modalDescription"
    );

const modalPhotoBackground =
    document.getElementById(
        "modalPhotoBackground"
    );


// ======================================================
// ESTADO
// ======================================================

let currentQuery =
    "travel";

let currentPage =
    1;

let loading =
    false;

let hasMoreImages =
    true;

let currentView =
    "explore";

let favorites =
    loadFavorites();


// Modal

let visiblePhotos =
    [];

let currentModalIndex =
    0;

let currentModalPhoto =
    null;


// API

let currentController =
    null;

let requestVersion =
    0;


// ======================================================
// FAVORITOS
// ======================================================

function loadFavorites() {

    try {

        const saved =
            localStorage.getItem(
                FAVORITES_STORAGE_KEY
            );

        if (!saved) {
            return [];
        }


        const parsed =
            JSON.parse(saved);


        return Array.isArray(parsed)
            ? parsed
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
            JSON.stringify(
                favorites
            )
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

    if (!favoritesCount) {
        return;
    }


    favoritesCount.textContent =
        favorites.length;
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
                    String(
                        favorite.id
                    ) !==
                    String(photo.id)
            );

    } else {

        favorites.unshift({

            id:
                photo.id,

            alt:
                photo.alt || "",

            photographer:
                photo.photographer ||
                "Fotógrafo desconhecido",

            url:
                photo.url || "#",

            src: {

                large:
                    photo.src.large,

                large2x:
                    photo.src.large2x ||
                    photo.src.large

            }

        });
    }


    saveFavorites();


    if (
        currentView ===
        "favorites"
    ) {

        renderFavorites();

    } else {

        updateFavoriteButtons();
    }
}


function updateFavoriteButtons() {

    const buttons =
        document.querySelectorAll(
            ".favorite-button"
        );


    buttons.forEach(
        (button) => {

            updateSingleFavoriteButton(
                button,
                button.dataset.photoId
            );

        }
    );
}


function updateSingleFavoriteButton(
    button,
    photoId
) {

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


// ======================================================
// FAVORITOS VIEW
// ======================================================

function showFavorites() {

    cancelCurrentRequest();


    currentView =
        "favorites";

    loading =
        false;


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

    gallery.innerHTML =
        "";


    visiblePhotos =
        [...favorites];


    hideStatus();


    if (
        favorites.length === 0
    ) {

        gallery.innerHTML = `
            <div class="favorites-empty">

                <span class="favorites-empty-icon">
                    ♡
                </span>

                <h3>
                    Nenhuma imagem favorita
                </h3>

                <p>
                    Explore a galeria e clique
                    no coração para salvar suas
                    fotografias favoritas.
                </p>

            </div>
        `;


        resultsInfo.textContent =
            "Você ainda não salvou nenhuma imagem";


        return;
    }


    renderImages(
        favorites,
        false
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
// CANCELAMENTO DE REQUEST
// ======================================================

function cancelCurrentRequest() {

    if (currentController) {

        currentController.abort();

        currentController =
            null;
    }
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
            per_page: PER_PAGE
        });


    const response =
        await fetch(
            `${API_URL}?${params.toString()}`,
            {
                signal
            }
        );


    const data =
        await response.json();


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

function showSkeletons(
    amount = 8
) {

    gallery.innerHTML =
        "";


    const fragment =
        document.createDocumentFragment();


    for (
        let index = 0;
        index < amount;
        index++
    ) {

        const skeleton =
            document.createElement(
                "div"
            );


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

    gallery
        .querySelectorAll(
            ".skeleton-item"
        )
        .forEach(
            (skeleton) =>
                skeleton.remove()
        );
}


// ======================================================
// CARREGAR IMAGENS
// ======================================================

async function loadImages({
    reset = false
} = {}) {

    if (
        currentView !==
        "explore"
    ) {
        return;
    }


    if (
        loading &&
        !reset
    ) {
        return;
    }


    if (
        !hasMoreImages &&
        !reset
    ) {
        return;
    }


    if (reset) {

        cancelCurrentRequest();

        requestVersion++;

        currentPage =
            1;

        hasMoreImages =
            true;

        visiblePhotos =
            [];

        showSkeletons();
    }


    const thisVersion =
        requestVersion;


    const pageToLoad =
        currentPage;


    const queryToLoad =
        currentQuery;


    currentController =
        new AbortController();


    loading =
        true;


    hideStatus();


    if (!reset) {

        showLoader();

    } else {

        hideLoader();
    }


    try {

        const data =
            await fetchImages(
                queryToLoad,
                pageToLoad,
                currentController.signal
            );


        if (
            thisVersion !==
                requestVersion ||
            currentView !==
                "explore"
        ) {
            return;
        }


        const photos =
            data.photos || [];


        if (reset) {

            removeSkeletons();
        }


        if (
            photos.length === 0 &&
            pageToLoad === 1
        ) {

            gallery.innerHTML =
                "";


            showStatus(
                `Nenhuma imagem encontrada para "${queryToLoad}".`
            );


            resultsInfo.textContent =
                "Tente pesquisar outro termo.";


            hasMoreImages =
                false;


            return;
        }


        renderImages(
            photos,
            true
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
            photos.length <
                PER_PAGE
        ) {

            hasMoreImages =
                false;
        }


        currentPage =
            pageToLoad + 1;


    } catch (error) {

        if (
            error.name ===
            "AbortError"
        ) {
            return;
        }


        console.error(
            "Erro ao buscar imagens:",
            error
        );


        if (
            thisVersion !==
                requestVersion ||
            currentView !==
                "explore"
        ) {
            return;
        }


        removeSkeletons();


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
            thisVersion ===
            requestVersion
        ) {

            loading =
                false;


            currentController =
                null;


            hideLoader();
        }
    }
}


// ======================================================
// RENDER
// ======================================================

function renderImages(
    photos,
    addToVisible = true
) {

    if (
        currentView ===
        "favorites"
    ) {

        visiblePhotos =
            [...favorites];

    } else if (
        addToVisible
    ) {

        const existingIds =
            new Set(
                visiblePhotos.map(
                    (photo) =>
                        String(photo.id)
                )
            );


        photos.forEach(
            (photo) => {

                if (
                    !existingIds.has(
                        String(photo.id)
                    )
                ) {

                    visiblePhotos.push(
                        photo
                    );


                    existingIds.add(
                        String(photo.id)
                    );
                }
            }
        );
    }


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
// CARD
// ======================================================

function createGalleryItem(
    photo
) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "gallery-item";


    article.tabIndex =
        0;


    const image =
        document.createElement(
            "img"
        );


    image.src =
        photo.src.large;


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


    updateSingleFavoriteButton(
        favoriteButton,
        photo.id
    );


    favoriteButton.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();


            toggleFavorite(
                photo
            );


            if (
                currentModalPhoto &&
                String(
                    currentModalPhoto.id
                ) ===
                String(photo.id)
            ) {

                updateModalFavorite();
            }

        }
    );


    favoriteButton.addEventListener(
        "keydown",
        (event) =>
            event.stopPropagation()
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


    article.addEventListener(
        "click",
        () =>
            openModal(photo)
    );


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

                openModal(photo);
            }

        }
    );


    return article;
}


// ======================================================
// PESQUISA
// ======================================================

searchForm?.addEventListener(
    "submit",
    async (event) => {

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


        scrollToGallery();


        await loadImages({
            reset: true
        });

    }
);


// ======================================================
// CATEGORIAS
// ======================================================

categoryButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            async () => {

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


                scrollToGallery();


                await loadImages({
                    reset: true
                });

            }
        );

    }
);


function clearActiveCategories() {

    categoryButtons.forEach(
        (button) =>

            button.classList.remove(
                "active"
            )

    );
}


// ======================================================
// FAVORITOS MENU
// ======================================================

favoritesNav?.addEventListener(
    "click",
    () => {

        showFavorites();


        navbarMenu?.classList.remove(
            "show"
        );


        navbarToggle?.setAttribute(
            "aria-expanded",
            "false"
        );

    }
);


// ======================================================
// MODAL
// ======================================================

function openModal(photo) {

    currentModalPhoto =
        photo;


    const foundIndex =
        visiblePhotos.findIndex(
            (item) =>
                String(item.id) ===
                String(photo.id)
        );


    currentModalIndex =
        foundIndex >= 0
            ? foundIndex
            : 0;


    if (
        foundIndex === -1
    ) {

        visiblePhotos =
            [photo];

        currentModalIndex =
            0;
    }


    updateModalContent();


    imageModal?.classList.add(
        "open"
    );


    imageModal?.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );


    modalClose?.focus();
}


// ======================================================
// ATUALIZAR MODAL
// ======================================================

function updateModalContent() {

    if (
        !visiblePhotos.length
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


    currentModalPhoto =
        photo;


    const imageUrl =
        photo.src.large2x ||
        photo.src.large;


    // FOTO PRINCIPAL

    if (modalImage) {

        modalImage.style.opacity =
            "0";


        modalImage.src =
            imageUrl;


        modalImage.alt =
            photo.alt ||
            `Fotografia de ${
                photo.photographer ||
                "fotógrafo desconhecido"
            }`;


        modalImage.onload =
            () => {

                modalImage.style.opacity =
                    "1";
            };
    }


    // BACKGROUND DINÂMICO

    if (
        modalPhotoBackground
    ) {

        modalPhotoBackground.style.backgroundImage =
            `url("${imageUrl}")`;
    }


    // FOTÓGRAFO

    if (
        modalPhotographer
    ) {

        modalPhotographer.textContent =
            photo.photographer ||
            "Fotógrafo desconhecido";
    }


    // DESCRIÇÃO

    if (
        modalDescription
    ) {

        modalDescription.textContent =
            photo.alt ||
            "Fotografia selecionada na galeria.";
    }


    // LINK

    if (
        modalOriginal
    ) {

        modalOriginal.href =
            photo.url || "#";
    }


    // CONTADOR

    if (
        modalCounter
    ) {

        const current =
            String(
                currentModalIndex + 1
            ).padStart(
                2,
                "0"
            );


        const total =
            String(
                visiblePhotos.length
            ).padStart(
                2,
                "0"
            );


        modalCounter.textContent =
            `${current} / ${total}`;
    }


    updateModalFavorite();

    updateModalNavigation();
}


// ======================================================
// FAVORITO MODAL
// ======================================================

function updateModalFavorite() {

    if (
        !modalFavorite ||
        !currentModalPhoto
    ) {
        return;
    }


    const favorite =
        isFavorite(
            currentModalPhoto.id
        );


    modalFavorite.classList.toggle(
        "active",
        favorite
    );


    modalFavorite.textContent =
        favorite
            ? "♥ Favoritado"
            : "♡ Favoritar";
}


modalFavorite?.addEventListener(
    "click",
    () => {

        if (
            !currentModalPhoto
        ) {
            return;
        }


        if (
            currentView !==
            "favorites"
        ) {

            toggleFavorite(
                currentModalPhoto
            );


            updateModalFavorite();

            return;
        }


        const oldIndex =
            currentModalIndex;


        toggleFavorite(
            currentModalPhoto
        );


        visiblePhotos =
            [...favorites];


        if (
            visiblePhotos.length ===
            0
        ) {

            closeModal();

            return;
        }


        currentModalIndex =
            Math.min(
                oldIndex,
                visiblePhotos.length - 1
            );


        updateModalContent();

    }
);


// ======================================================
// NAVEGAÇÃO MODAL
// ======================================================

function showPreviousImage() {

    if (
        visiblePhotos.length <= 1
    ) {
        return;
    }


    currentModalIndex--;


    if (
        currentModalIndex < 0
    ) {

        currentModalIndex =
            visiblePhotos.length - 1;
    }


    updateModalContent();
}


function showNextImage() {

    if (
        visiblePhotos.length <= 1
    ) {
        return;
    }


    currentModalIndex++;


    if (
        currentModalIndex >=
        visiblePhotos.length
    ) {

        currentModalIndex =
            0;
    }


    updateModalContent();
}


function updateModalNavigation() {

    const disabled =
        visiblePhotos.length <= 1;


    if (
        modalPrevious
    ) {

        modalPrevious.disabled =
            disabled;


        modalPrevious.style.opacity =
            disabled
                ? "0.3"
                : "1";
    }


    if (
        modalNext
    ) {

        modalNext.disabled =
            disabled;


        modalNext.style.opacity =
            disabled
                ? "0.3"
                : "1";
    }
}


modalPrevious?.addEventListener(
    "click",
    showPreviousImage
);


modalNext?.addEventListener(
    "click",
    showNextImage
);


// ======================================================
// FECHAR MODAL
// ======================================================

function closeModal() {

    imageModal?.classList.remove(
        "open"
    );


    imageModal?.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "modal-open"
    );


    if (
        modalImage
    ) {

        modalImage.src =
            "";
    }


    if (
        modalPhotoBackground
    ) {

        modalPhotoBackground.style.backgroundImage =
            "none";
    }


    currentModalPhoto =
        null;
}


modalClose?.addEventListener(
    "click",
    closeModal
);


modalBackdrop?.addEventListener(
    "click",
    closeModal
);


// ======================================================
// TECLADO
// ======================================================

document.addEventListener(
    "keydown",
    (event) => {

        if (
            !imageModal?.classList.contains(
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

            return;
        }


        if (
            event.key ===
            "ArrowLeft"
        ) {

            event.preventDefault();

            showPreviousImage();

            return;
        }


        if (
            event.key ===
            "ArrowRight"
        ) {

            event.preventDefault();

            showNextImage();
        }

    }
);


// ======================================================
// LOADER
// ======================================================

function showLoader() {

    if (
        loader &&
        currentView ===
        "explore"
    ) {

        loader.hidden =
            false;
    }
}


function hideLoader() {

    if (loader) {

        loader.hidden =
            true;
    }
}


// ======================================================
// STATUS
// ======================================================

function showStatus(message) {

    if (!statusMessage) {
        return;
    }


    statusMessage.textContent =
        message;


    statusMessage.classList.add(
        "show"
    );
}


function hideStatus() {

    if (!statusMessage) {
        return;
    }


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

            threshold:
                0

        }
    );


if (
    scrollSentinel
) {

    observer.observe(
        scrollSentinel
    );
}


// ======================================================
// MENU MOBILE
// ======================================================

navbarToggle?.addEventListener(
    "click",
    () => {

        const isOpen =
            navbarMenu?.classList.toggle(
                "show"
            );


        navbarToggle.setAttribute(
            "aria-expanded",
            String(
                Boolean(isOpen)
            )
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

                    navbarMenu?.classList.remove(
                        "show"
                    );


                    navbarToggle?.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }
            );

        }
    );


// ======================================================
// SCROLL GALERIA
// ======================================================

function scrollToGallery() {

    const section =
        document.getElementById(
            "galeria"
        );


    if (!section) {
        return;
    }


    setTimeout(
        () => {

            section.scrollIntoView({

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


        backToTop.classList.toggle(
            "show",
            window.scrollY > 600
        );

    },
    {
        passive:
            true
    }
);


backToTop?.addEventListener(
    "click",
    () => {

        window.scrollTo({

            top:
                0,

            behavior:
                "smooth"

        });

    }
);


// ======================================================
// INICIAR
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
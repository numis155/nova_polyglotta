let catalog;
let currentChapterData;
let currentPage = 1;

const translationSelect = document.getElementById("translationSelect");
const bookSelect = document.getElementById("bookSelect");
const chapterSelect = document.getElementById("chapterSelect");
const pageSizeSelect = document.getElementById("pageSizeSelect");

const breadcrumb = document.getElementById("breadcrumb");
const chapterTitle = document.getElementById("chapterTitle");
const versesContainer = document.getElementById("versesContainer");
const pageInfo = document.getElementById("pageInfo");

const prevChapterBtn = document.getElementById("prevChapterBtn");
const nextChapterBtn = document.getElementById("nextChapterBtn");
const firstPageBtn = document.getElementById("firstPageBtn");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const lastPageBtn = document.getElementById("lastPageBtn");

async function init() {
  catalog = await fetchJson("data/catalog.json");

  loadTranslations();
  loadBooks();
  loadChapters();

  await loadChapter();
}

async function fetchJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`No se pudo cargar: ${path}`);
  }

  return await response.json();
}

function loadTranslations() {
  translationSelect.innerHTML = "";

  catalog.translations.forEach(translation => {
    const option = document.createElement("option");
    option.value = translation.id;
    option.textContent = translation.shortName || translation.name;
    translationSelect.appendChild(option);
  });
}

function loadBooks() {
  const translationId = translationSelect.value;
  bookSelect.innerHTML = "";

  catalog.books
    .filter(book => book.availableTranslations.includes(translationId))
    .sort((a, b) => a.order - b.order)
    .forEach(book => {
      const option = document.createElement("option");
      option.value = book.id;
      option.textContent = book.name;
      bookSelect.appendChild(option);
    });
}

function loadChapters() {
  const translationId = translationSelect.value;
  const bookId = bookSelect.value;
  const book = getBook(bookId);

  chapterSelect.innerHTML = "";

  book.perTranslation[translationId].chapters.forEach(chapter => {
    const option = document.createElement("option");
    option.value = chapter;
    option.textContent = chapter;
    chapterSelect.appendChild(option);
  });
}

async function loadChapter() {
  currentPage = 1;

  const translationId = translationSelect.value;
  const bookId = bookSelect.value;
  const chapter = chapterSelect.value;

  currentChapterData = await fetchJson(
    `data/translations/${translationId}/${bookId}/${chapter}.json`
  );

  render();
}

function render() {
  const book = getBook(currentChapterData.book);
  const translation = getTranslation(currentChapterData.translation);

  breadcrumb.textContent =
    `${translation.shortName || translation.name} › ${book.name} › Capítulo ${currentChapterData.chapter}`;

  chapterTitle.textContent = `${book.name} ${currentChapterData.chapter}`;

  renderVerses();
  renderPager();
}

function renderVerses() {
  versesContainer.innerHTML = "";

  const pageSize = Number(pageSizeSelect.value);
  const verses = currentChapterData.verses;
  const totalPages = Math.ceil(verses.length / pageSize);

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const startIndex = (currentPage - 1) * pageSize;
  const pageVerses = verses.slice(startIndex, startIndex + pageSize);

  pageVerses.forEach(verse => {
    const row = document.createElement("div");
    row.className = "verse-row";

    const number = document.createElement("span");
    number.className = "verse-number";
    number.textContent = verse.v;

    const text = document.createElement("span");
    text.className = "verse-text";

    if (verse.missing) {
      text.innerHTML = "<em>Versículo ausente en esta edición.</em>";
      row.classList.add("missing");
    } else {
      text.textContent = verse.text;
    }

    row.appendChild(number);
    row.appendChild(text);
    versesContainer.appendChild(row);
  });
}

function renderPager() {
  const pageSize = Number(pageSizeSelect.value);
  const totalVerses = currentChapterData.verses.length;
  const totalPages = Math.ceil(totalVerses / pageSize);

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalVerses);

  pageInfo.textContent =
    `Página ${currentPage} / ${totalPages} · versículos ${start}-${end} de ${totalVerses}`;

  firstPageBtn.disabled = currentPage === 1;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
  lastPageBtn.disabled = currentPage === totalPages;
}

function getBook(bookId) {
  return catalog.books.find(book => book.id === bookId);
}

function getTranslation(translationId) {
  return catalog.translations.find(translation => translation.id === translationId);
}

async function goToChapter(offset) {
  const chapters = Array.from(chapterSelect.options).map(option => Number(option.value));
  const currentChapter = Number(chapterSelect.value);
  const index = chapters.indexOf(currentChapter);
  const newIndex = index + offset;

  if (newIndex < 0 || newIndex >= chapters.length) return;

  chapterSelect.value = chapters[newIndex];
  await loadChapter();
}

function changePage(offset) {
  const pageSize = Number(pageSizeSelect.value);
  const totalPages = Math.ceil(currentChapterData.verses.length / pageSize);

  currentPage += offset;

  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  renderVerses();
  renderPager();
}

translationSelect.addEventListener("change", async () => {
  loadBooks();
  loadChapters();
  await loadChapter();
});

bookSelect.addEventListener("change", async () => {
  loadChapters();
  await loadChapter();
});

chapterSelect.addEventListener("change", loadChapter);

pageSizeSelect.addEventListener("change", () => {
  currentPage = 1;
  renderVerses();
  renderPager();
});

prevChapterBtn.addEventListener("click", () => goToChapter(-1));
nextChapterBtn.addEventListener("click", () => goToChapter(1));

firstPageBtn.addEventListener("click", () => {
  currentPage = 1;
  renderVerses();
  renderPager();
});

prevPageBtn.addEventListener("click", () => changePage(-1));
nextPageBtn.addEventListener("click", () => changePage(1));

lastPageBtn.addEventListener("click", () => {
  currentPage = Math.ceil(
    currentChapterData.verses.length / Number(pageSizeSelect.value)
  );
  renderVerses();
  renderPager();
});

init();
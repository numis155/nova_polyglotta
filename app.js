let catalog = null;

const translationSelect = document.getElementById("translationSelect");
const bookSelect = document.getElementById("bookSelect");
const chapterSelect = document.getElementById("chapterSelect");
const verseSelect = document.getElementById("verseSelect");
const reader = document.getElementById("reader");

async function loadCatalog() {
  const response = await fetch("data/catalog.json");
  catalog = await response.json();

  loadTranslations();
  loadBooks();
  loadChapters();
  await loadVerses();
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
  bookSelect.innerHTML = "";

  const translationId = translationSelect.value;

  catalog.books
    .filter(book => book.availableTranslations.includes(translationId))
    .forEach(book => {
      const option = document.createElement("option");
      option.value = book.id;
      option.textContent = book.name;
      bookSelect.appendChild(option);
    });
}

function loadChapters() {
  chapterSelect.innerHTML = "";

  const translationId = translationSelect.value;
  const bookId = bookSelect.value;

  const book = catalog.books.find(book => book.id === bookId);
  const chapters = book.perTranslation[translationId].chapters;

  chapters.forEach(chapter => {
    const option = document.createElement("option");
    option.value = chapter;
    option.textContent = chapter;
    chapterSelect.appendChild(option);
  });
}

async function loadVerses() {
  verseSelect.innerHTML = "";

  const data = await loadChapterData();

  data.verses.forEach(verse => {
    const option = document.createElement("option");
    option.value = verse.v;
    option.textContent = verse.v;
    verseSelect.appendChild(option);
  });

  showVerse(data);
}

async function loadChapterData() {
  const translationId = translationSelect.value;
  const bookId = bookSelect.value;
  const chapter = chapterSelect.value;

  const path = `data/translations/${translationId}/${bookId}/${chapter}.json`;

  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`No se pudo cargar ${path}`);
  }

  return await response.json();
}

async function showVerse(existingData = null) {
  const data = existingData || await loadChapterData();
  const verseNumber = Number(verseSelect.value);

  const verse = data.verses.find(v => v.v === verseNumber);

  if (!verse) {
    reader.innerHTML = "<p>Versículo no encontrado.</p>";
    return;
  }

  if (verse.missing) {
    reader.innerHTML = `
      <h2>${data.book.toUpperCase()} ${data.chapter},${verse.v}</h2>
      <p><em>Versículo ausente en esta edición.</em></p>
    `;
    return;
  }

  reader.innerHTML = `
    <h2>${data.book.toUpperCase()} ${data.chapter},${verse.v}</h2>
    <p>${verse.text}</p>
  `;
}

translationSelect.addEventListener("change", async () => {
  loadBooks();
  loadChapters();
  await loadVerses();
});

bookSelect.addEventListener("change", async () => {
  loadChapters();
  await loadVerses();
});

chapterSelect.addEventListener("change", loadVerses);
verseSelect.addEventListener("change", () => showVerse());

loadCatalog();
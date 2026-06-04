async function cargar() {

    const respuesta =
        await fetch("data/translations/cee/jhn/1.json");

    const datos =
        await respuesta.json();

    document.getElementById("content").innerHTML =
        datos.verses[0].text;
}

cargar();
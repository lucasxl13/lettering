import { t, loadLanguage, getLanguage } from "../systems/language.js";

export function loadMenu() {

    const app = document.getElementById("app");

app.innerHTML = `

<div class="menu">

    <div class="title">

        <div class="letter-block">L</div>

        <div class="letter-block">E</div>

        <div class="letter-block">T</div>

        <div class="letter-block">T</div>

        <div class="letter-block">E</div>

        <div class="letter-block">R</div>

        <div class="letter-block">I</div>

        <div class="letter-block">N</div>

        <div class="letter-block">G</div>

    </div>

    <button class="menu_button">

        ${t("play")}

    </button>

    <button class="menu_button">

        ${t("settings")}

    </button>

    <button class="menu_button">

        ${t("credits")}

    </button>

    <button class="menu_button">

        ${t("help")}

    </button>

    <div class="languages">

        <img 

            class="flag ${getLanguage() === "pt-BR" ? "active" : ""}"

            src="assets/sprites/flags/br.svg"

            data-language="pt-BR"

        >   

        <img 

            class="flag ${getLanguage() === "en-US" ? "active" : ""}"

            src="assets/sprites/flags/us.svg"

            data-language="en-US"

        >

        <img 

            class="flag ${getLanguage() === "es-ES" ? "active" : ""}"

            src="assets/sprites/flags/es.svg"

            data-language="es-ES"

        >

    </div>

</div> 

`;

document.querySelectorAll(".letter-block")
.forEach(block => {
    block.addEventListener("animationend", (event)=>{
        if(event.animationName === "blockFall" && block === document.querySelector(".letter-block:last-child")){
            document.querySelector(".title")
            .classList.add("complete");
        }
    });
});

document.querySelectorAll(".languages img").forEach(flag => {
    flag.onclick = async () => {
        await loadLanguage(flag.dataset.language);
        loadMenu();
    };
});

}
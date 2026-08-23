import { t, loadLanguage, getLanguage } from "../systems/language.js";



export function loadMenu(){


    const app = document.getElementById("app");



    app.innerHTML = `


    <div class="menu">


        <h1 class="title">

            ${t("game_title")}

        </h1>



        <button class="menu_button">

            ${t("play")}

        </button>


        <button class="menu_button">

            ${t("settings")}

        </button>



        <button class="menu_button">

            ${t("credits")}

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



    document
    .querySelectorAll(".languages img")
    .forEach(flag => {


        flag.onclick = async () => {


            await loadLanguage(
                flag.dataset.language
            );


            loadMenu();


        };


    });


}
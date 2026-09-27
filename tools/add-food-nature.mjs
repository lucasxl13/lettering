import { readFileSync, writeFileSync } from 'node:fs';

const frontendPath = new URL('../script/data/words.json', import.meta.url);
const backendPath = new URL('../../lettering-backend/data/english/words.json', import.meta.url);
const data = JSON.parse(readFileSync(frontendPath, 'utf8'));

const sourceThemes = Object.entries(data.general)
    .filter(([theme]) => !['food', 'nature'].includes(theme));
const catalog = new Map();
for (const [, theme] of sourceThemes) for (const entry of theme.words) {
    const current = catalog.get(entry.word);
    if (!current) catalog.set(entry.word, structuredClone(entry));
    else for (const locale of ['pt-BR', 'es-ES']) {
        current.translations[locale] = [...new Set([
            ...current.translations[locale], ...entry.translations[locale],
        ])];
    }
}

function roots(value) { return new Set(value.trim().split(/\s+/)); }
function words(value) { return new Set(value.trim().split(/\s+/)); }
function selectByRoots(rootSet) {
    return [...catalog.values()].filter(entry => [...rootSet].some(root =>
        entry.word === root || entry.word.startsWith(root)
    ));
}
function selectExact(wordSet) {
    return [...wordSet].map(word => catalog.get(word)).filter(Boolean);
}
function parseNew(value) {
    return value.trim().split('\n').map(line => {
        const [word, portuguese, spanish] = line.split('|');
        return { word, translations: { 'pt-BR': [portuguese], 'es-ES': [spanish] }, score: word.length * 10 };
    });
}
function build(entries, minimum, theme) {
    const unique = new Map();
    for (const entry of entries) {
        const current = unique.get(entry.word);
        if (!current) unique.set(entry.word, structuredClone(entry));
        else for (const locale of ['pt-BR', 'es-ES']) {
            current.translations[locale] = [...new Set([
                ...current.translations[locale], ...entry.translations[locale],
            ])];
        }
    }
    const result = [...unique.values()].sort((a, b) => a.word.localeCompare(b.word, 'en'));
    if (result.length < minimum) throw new Error(`Expected ${minimum} ${theme} words, found ${result.length}`);
    return { words: result };
}

const foodRoots = roots(`
BAK BOIL BREW CHEW CHOP COOK CUT DIP DRINK EAT FEED FILL FLAVOR FRY GRILL
LICK MIX PEEL POUR ROAST SERVE SIP SLICE SPREAD SQUEEZE STIR SWALLOW TASTE
TOAST WASH WHISK BITE BLEND BURN CARRY COLLECT COOL CRUSH DRY EMPTY FREEZE
GATHER GROW HEAT MELT PACK PICK PREPARE PRESS RINSE ROLL RUB SCOOP SMELL
SOAK SPRAY STEAM WRAP ADD ARRANGE BUY CHOOSE CLEAN CLOSE CREATE DELIVER ENJOY
GIVE HOLD KEEP MAKE MEASURE OFFER OPEN ORDER PLACE RECEIVE REMOVE SAVE SELL
SHARE SHOP TAKE TRY USE WANT WEIGH ACCEPT CHECK COMBINE COVER DECORATE
`);
const foodExact = words(`
ABLE BITTER COLD DELICIOUS DRY EMPTY FRESH FULL GOOD HEALTHY HOT HUNGRY RAW
SALTY SOUR SWEET TASTY THIRSTY WARM WET BOWL BOTTLE CUP DISH FORK FRIDGE
GLASS JAR KNIFE MUG OVEN PAN PLATE SPOON STOVE TOASTER BLENDER BUCKET CAN
CANOPENER COFFEEMAKER COLANDER CORKSCREW CUTTINGBOARD FREEZER FUNNEL GRATER
KETTLE LADLE MEASURINGCUP MICROWAVE MIXER NAPKIN NUTCRACKER OPENER PEELER
PITCHER POT ROLLINGPIN SAUCEPAN SIEVE SPATULA STRAINER TEAPOT THERMOS TRAY
BREAKFAST DINNER FOOD LUNCH MEAL WATER
`);
const newFood = parseNew(`
ALMOND|amêndoa|almendra
APPLE|maçã|manzana
APRICOT|damasco|albaricoque
AVOCADO|abacate|aguacate
BACON|bacon|tocino
BAGEL|bagel|bagel
BANANA|banana|banana
BARLEY|cevada|cebada
BASIL|manjericão|albahaca
BEAN|feijão|frijol
BEEF|carne bovina|carne de res
BEET|beterraba|remolacha
BERRY|fruta silvestre|baya
BISCUIT|biscoito|galleta
BLACKBERRY|amora-preta|mora
BLUEBERRY|mirtilo|arándano
BREAD|pão|pan
BROCCOLI|brócolis|brócoli
BURGER|hambúrguer|hamburguesa
BUTTER|manteiga|mantequilla
CABBAGE|repolho|col
CAKE|bolo|pastel
CANDY|doce|caramelo
CARROT|cenoura|zanahoria
CASHEW|castanha de caju|anacardo
CELERY|aipo|apio
CEREAL|cereal|cereal
CHEESE|queijo|queso
CHERRY|cereja|cereza
CHICKEN|frango|pollo
CHILI|pimenta|chile
CHOCOLATE|chocolate|chocolate
CINNAMON|canela|canela
COCONUT|coco|coco
COFFEE|café|café
COOKIE|biscoito|galleta
CORN|milho|maíz
CREAM|creme|crema
CROISSANT|croissant|cruasán
CUCUMBER|pepino|pepino
CUPCAKE|bolinho|magdalena
CURRY|caril|curry
DONUT|rosquinha|dona
DOUGH|massa|masa
EGG|ovo|huevo
EGGPLANT|berinjela|berenjena
FLOUR|farinha|harina
GARLIC|alho|ajo
GINGER|gengibre|jengibre
GRAPE|uva|uva
GRAPEFRUIT|toranja|pomelo
GUAVA|goiaba|guayaba
HAM|presunto|jamón
HAMBURGER|hambúrguer|hamburguesa
HAZELNUT|avelã|avellana
HERB|erva|hierba
HONEY|mel|miel
ICECREAM|sorvete|helado
JAM|geleia|mermelada
JUICE|suco|jugo
KALE|couve|col rizada
KIWI|kiwi|kiwi
LEMON|limão|limón
LEMONADE|limonada|limonada
LENTIL|lentilha|lenteja
LETTUCE|alface|lechuga
LIME|lima|lima
LOBSTER|lagosta|langosta
MANGO|manga|mango
MAYONNAISE|maionese|mayonesa
MEAT|carne|carne
MELON|melão|melón
MILK|leite|leche
MUFFIN|bolinho|muffin
MUSHROOM|cogumelo|champiñón
MUSTARD|mostarda|mostaza
NOODLE|macarrão|fideo
OAT|aveia|avena
OIL|óleo|aceite
OLIVE|azeitona|aceituna
ONION|cebola|cebolla
ORANGE|laranja|naranja
PAPAYA|mamão|papaya
PARSLEY|salsa|perejil
PASTA|massa|pasta
PEACH|pêssego|melocotón
PEANUT|amendoim|cacahuete
PEAR|pera|pera
PEA|ervilha|guisante
PEPPER|pimentão|pimiento
PIE|torta|tarta
PINEAPPLE|abacaxi|piña
PIZZA|pizza|pizza
PLUM|ameixa|ciruela
POPCORN|pipoca|palomitas
PORK|carne suína|cerdo
POTATO|batata|patata
PUMPKIN|abóbora|calabaza
QUINOA|quinoa|quinua
RADISH|rabanete|rábano
RAISIN|uva-passa|pasa
RASPBERRY|framboesa|frambuesa
RICE|arroz|arroz
ROSEMARY|alecrim|romero
SALAD|salada|ensalada
SALMON|salmão|salmón
SALT|sal|sal
SANDWICH|sanduíche|sándwich
SAUCE|molho|salsa
SAUSAGE|linguiça|salchicha
SEAFOOD|frutos do mar|mariscos
SHRIMP|camarão|camarón
SOUP|sopa|sopa
SPINACH|espinafre|espinaca
STEAK|bife|bistec
STRAWBERRY|morango|fresa
SUGAR|açúcar|azúcar
SUSHI|sushi|sushi
SYRUP|xarope|jarabe
TACO|taco|taco
TEA|chá|té
THYME|tomilho|tomillo
TOMATO|tomate|tomate
TUNA|atum|atún
TURKEY|peru|pavo
VANILLA|baunilha|vainilla
VINEGAR|vinagre|vinagre
WALNUT|noz|nuez
WATERMELON|melancia|sandía
WHEAT|trigo|trigo
YOGURT|iogurte|yogur
ZUCCHINI|abobrinha|calabacín
`);

const natureRoots = roots(`
BLOOM BLOW BURN CRAWL CREEP DIG DIVE DRIP FALL FLOAT FLOW FLY FREEZE GROW
HUNT LAND MELT PLANT RAIN RISE ROAR ROLL ROOT SAIL SHINE SINK SNOW SOAK
SPIN SPLASH SPRAY SPRING STING SWIM THUNDER WANDER WAVE BREATHE CLIMB
`);
const natureExact = words(`
ALIVE BEAUTIFUL BIG BITTER BLACK BLUE BRIGHT BROWN CLOUDY COLD COLORFUL DARK
DEAD DEEP DRY ENORMOUS FRESH GREEN HEAVY HIGH HUGE NATURAL ORANGE PURE RAW
RED ROUGH ROUND SHARP SMALL SOFT SOLID STRONG TALL THICK THIN TINY WARM WET
WHITE WIDE WILD YELLOW EARTH AIR BEACH DESERT FIELD FOREST GARDEN HILL ISLAND
LAKE LAND MOUNTAIN OCEAN PARK RIVER SEA SKY VALLEY WATER WEATHER WIND AUTUMN
CLOUD FLOOD ICE MOON RAIN SEASON SNOW SPRING STAR STORM SUMMER WINTER FIRE
ENVIRONMENT NATURE SUN FLOWER GROUND
`);
const newNature = parseNew(`
ACACIA|acácia|acacia
ALGAE|alga|alga
AMBER|âmbar|ámbar
BAMBOO|bambu|bambú
BARK|casca|corteza
BASALT|basalto|basalto
BAY|baía|bahía
BIRCH|bétula|abedul
BLOSSOM|flor|flor
BOULDER|pedregulho|peñasco
BRANCH|galho|rama
BUSH|arbusto|arbusto
CANYON|cânion|cañón
CAVE|caverna|cueva
CEDAR|cedro|cedro
CLIFF|penhasco|acantilado
COAST|costa|costa
CORAL|coral|coral
CRATER|cratera|cráter
CREEK|riacho|arroyo
CRYSTAL|cristal|cristal
DAISY|margarida|margarita
DELTA|delta|delta
DUNE|duna|duna
ECLIPSE|eclipse|eclipse
EROSION|erosão|erosión
FERN|samambaia|helecho
FJORD|fiorde|fiordo
FLORA|flora|flora
FOG|neblina|niebla
FOSSIL|fóssil|fósil
GLACIER|geleira|glaciar
GRANITE|granito|granito
GRASS|grama|hierba
GROVE|bosque|arboleda
HAIL|granizo|granizo
HORIZON|horizonte|horizonte
HURRICANE|furacão|huracán
IVY|hera|hiedra
JUNGLE|selva|selva
LAGOON|lagoa|laguna
LAVA|lava|lava
LEAF|folha|hoja
LIGHTNING|relâmpago|relámpago
LILY|lírio|lirio
MARSH|pântano|pantano
MEADOW|prado|pradera
METEOR|meteoro|meteoro
MINERAL|mineral|mineral
MOSS|musgo|musgo
OAK|carvalho|roble
ORCHID|orquídea|orquídea
PALM|palmeira|palmera
PEBBLE|seixo|guijarro
PINE|pinheiro|pino
PLAIN|planície|llanura
POND|lagoa|estanque
QUARTZ|quartzo|cuarzo
REEF|recife|arrecife
ROCK|rocha|roca
ROSE|rosa|rosa
SAND|areia|arena
SAP|seiva|savia
SHORE|margem|orilla
SOIL|solo|suelo
SWAMP|pântano|pantano
THORN|espinho|espina
TIDE|maré|marea
TORNADO|tornado|tornado
TREE|árvore|árbol
TULIP|tulipa|tulipán
VINE|trepadeira|vid
VOLCANO|vulcão|volcán
WATERFALL|cachoeira|cascada
WAVE|onda|ola
WILLOW|salgueiro|sauce
WOOD|madeira|madera
`);

// The grammatical themes are broad. Concrete entries from the semantic themes
// also belong to nouns, while verbs/adjectives selected below keep their original
// grammatical membership.
data.general.nouns = build([
    ...data.general.nouns.words,
    ...data.general.objects.words,
    ...data.general.animals.words,
    ...newFood,
    ...newNature,
], 500, 'nouns');
data.general.food = build([
    ...selectByRoots(foodRoots), ...selectExact(foodExact), ...newFood,
], 500, 'food');
data.general.nature = build([
    ...data.general.animals.words, ...selectByRoots(natureRoots),
    ...selectExact(natureExact), ...newNature,
], 500, 'nature');

const output = `${JSON.stringify(data, null, 2)}\n`;
writeFileSync(frontendPath, output);
writeFileSync(backendPath, output);
console.log(`Wrote ${data.general.food.words.length} food and ${data.general.nature.words.length} nature words.`);

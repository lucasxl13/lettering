import { readFileSync, writeFileSync } from 'node:fs';

const frontendPath = new URL('../script/data/words.json', import.meta.url);
const backendPath = new URL('../../lettering-backend/data/english/words.json', import.meta.url);
const data = JSON.parse(readFileSync(frontendPath, 'utf8'));

const source = `
ALARM|alarme|alarma
ALBUM|álbum|álbum
ANCHOR|âncora|ancla
ANTENNA|antena|antena
APRON|avental|delantal
ARMCHAIR|poltrona|sillón
ARROW|flecha|flecha
BACKPACK|mochila|mochila
BALL|bola|pelota
BALLOON|balão|globo
BANDAGE|curativo|vendaje
BASKET|cesta|cesta
BATTERY|bateria|batería
BED|cama|cama
BELL|sino|campana
BELT|cinto|cinturón
BENCH|banco|banco
BICYCLE|bicicleta|bicicleta
BIN|lixeira|cubo
BLANKET|cobertor|manta
BLENDER|liquidificador|licuadora
BOARD|quadro|tablero
BOOK|livro|libro
BOOT|bota|bota
BOTTLE|garrafa|botella
BOWL|tigela|tazón
BOX|caixa|caja
BRACELET|pulseira|pulsera
BROOM|vassoura|escoba
BRUSH|escova|cepillo
BUCKET|balde|cubo
BUTTON|botão|botón
CABLE|cabo|cable
CALCULATOR|calculadora|calculadora
CAMERA|câmera|cámara
CANDLE|vela|vela
CANVAS|tela|lienzo
CARPET|tapete|alfombra
CART|carrinho|carrito
CASE|estojo|estuche
CHAIN|corrente|cadena
CHAIR|cadeira|silla
CHARGER|carregador|cargador
CLOCK|relógio|reloj
CLOSET|armário|armario
CLOTH|pano|paño
COIN|moeda|moneda
COMB|pente|peine
COMPASS|bússola|brújula
COMPUTER|computador|computadora
CONTAINER|recipiente|recipiente
COUCH|sofá|sofá
CUP|xícara|taza
CURTAIN|cortina|cortina
CUSHION|almofada|cojín
DESK|escrivaninha|escritorio
DICTIONARY|dicionário|diccionario
DISH|prato|plato
DOOR|porta|puerta
DRILL|furadeira|taladro
DRUM|tambor|tambor
EARPHONE|fone de ouvido|auricular
EARRING|brinco|pendiente
ENVELOPE|envelope|sobre
ERASER|borracha|goma
FAN|ventilador|ventilador
FAUCET|torneira|grifo
FENCE|cerca|valla
FLASHLIGHT|lanterna|linterna
FOLDER|pasta|carpeta
FORK|garfo|tenedor
FRAME|moldura|marco
FRIDGE|geladeira|nevera
GLASS|copo|vaso
GLOVE|luva|guante
GLUE|cola|pegamento
GUITAR|violão|guitarra
HAMMER|martelo|martillo
HANGER|cabide|percha
HAT|chapéu|sombrero
HEADPHONE|fone de ouvido|auriculares
HELMET|capacete|casco
HOOK|gancho|gancho
IRON|ferro de passar|plancha
JACKET|jaqueta|chaqueta
JAR|pote|frasco
KEY|chave|llave
KEYBOARD|teclado|teclado
KNIFE|faca|cuchillo
LADDER|escada|escalera
LAMP|lâmpada|lámpara
LAPTOP|notebook|portátil
LENS|lente|lente
LIGHTER|isqueiro|encendedor
LOCK|cadeado|candado
MAGAZINE|revista|revista
MAGNET|ímã|imán
MASK|máscara|máscara
MAT|capacho|esterilla
MATCH|fósforo|cerilla
MICROPHONE|microfone|micrófono
MICROSCOPE|microscópio|microscopio
MIRROR|espelho|espejo
MONITOR|monitor|monitor
MOP|esfregão|fregona
MOUSE|mouse|ratón
MUG|caneca|taza
NAIL|prego|clavo
NECKLACE|colar|collar
NEEDLE|agulha|aguja
NOTEBOOK|caderno|cuaderno
OVEN|forno|horno
PACKAGE|pacote|paquete
PADLOCK|cadeado|candado
PAN|frigideira|sartén
PAPER|papel|papel
PENCIL|lápis|lápiz
PHONE|telefone|teléfono
PIANO|piano|piano
PILLOW|travesseiro|almohada
PIN|alfinete|alfiler
PIPE|cano|tubería
PLATE|prato|plato
PLUG|plugue|enchufe
POCKET|bolso|bolsillo
PRINTER|impressora|impresora
PURSE|bolsa|bolso
RADIO|rádio|radio
RAZOR|barbeador|afeitadora
REMOTE|controle remoto|mando
RING|anel|anillo
ROPE|corda|cuerda
RULER|régua|regla
SCARF|cachecol|bufanda
SCISSORS|tesoura|tijeras
SCREEN|tela|pantalla
SCREW|parafuso|tornillo
SCREWDRIVER|chave de fenda|destornillador
SHELF|prateleira|estante
SHIRT|camisa|camisa
SHOE|sapato|zapato
SHOVEL|pá|pala
SINK|pia|fregadero
SOCK|meia|calcetín
SOFA|sofá|sofá
SPEAKER|alto-falante|altavoz
SPOON|colher|cuchara
STAPLER|grampeador|grapadora
STOOL|banquinho|taburete
STOVE|fogão|estufa
SUITCASE|mala|maleta
TABLE|mesa|mesa
TABLET|tablet|tableta
TELESCOPE|telescópio|telescopio
THERMOMETER|termômetro|termómetro
TOASTER|torradeira|tostadora
TOOTHBRUSH|escova de dentes|cepillo de dientes
TOOTHPASTE|pasta de dente|pasta dental
TOWEL|toalha|toalla
TOY|brinquedo|juguete
UMBRELLA|guarda-chuva|paraguas
VASE|vaso|jarrón
WALLET|carteira|billetera
WATCH|relógio de pulso|reloj
WINDOW|janela|ventana
WIRE|fio|cable
WRENCH|chave inglesa|llave inglesa
ZIPPER|zíper|cremallera
AIRPLANE|avião|avión
AMBULANCE|ambulância|ambulancia
BOAT|barco|barco
BUS|ônibus|autobús
CAR|carro|coche
ENGINE|motor|motor
MOTORCYCLE|motocicleta|motocicleta
SCOOTER|patinete|patinete
SHIP|navio|barco
TRAIN|trem|tren
TRUCK|caminhão|camión
WHEEL|roda|rueda
CARD|cartão|tarjeta
CHECK|cheque|cheque
DOCUMENT|documento|documento
FILE|arquivo|archivo
MAP|mapa|mapa
PASSPORT|passaporte|pasaporte
STAMP|selo|sello
TICKET|ingresso|billete
BADGE|distintivo|insignia
CAP|boné|gorra
COAT|casaco|abrigo
DRESS|vestido|vestido
JEANS|calça jeans|vaqueros
PAJAMAS|pijama|pijama
PANTS|calça|pantalones
SHORTS|bermuda|pantalones cortos
SKIRT|saia|falda
SLIPPER|chinelo|zapatilla
SWEATER|suéter|suéter
TIE|gravata|corbata
UNIFORM|uniforme|uniforme
BASEBALL|bola de beisebol|pelota de béisbol
BAT|taco|bate
DICE|dados|dados
DOLL|boneca|muñeca
KITE|pipa|cometa
PUZZLE|quebra-cabeça|rompecabezas
RACKET|raquete|raqueta
SKATEBOARD|skate|monopatín
TROPHY|troféu|trofeo
WHISTLE|apito|silbato
BRACKET|suporte|soporte
BARREL|barril|barril
BRICK|tijolo|ladrillo
CEMENT|cimento|cemento
HANDLE|maçaneta|manija
LID|tampa|tapa
NET|rede|red
POLE|poste|poste
SIGN|placa|señal
TILE|azulejo|baldosa
TOOL|ferramenta|herramienta
TRAY|bandeja|bandeja
ADAPTER|adaptador|adaptador
AIRCONDITIONER|ar-condicionado|aire acondicionado
AMPLIFIER|amplificador|amplificador
AXE|machado|hacha
BAG|bolsa|bolsa
BAKINGPAN|assadeira|bandeja de horno
BASIN|bacia|palangana
BEDFRAME|estrutura de cama|estructura de cama
BEDSHEET|lençol|sábana
BINOCULARS|binóculos|prismáticos
BOOKCASE|estante de livros|librería
BOOKMARK|marcador de página|marcapáginas
BRIEFCASE|pasta executiva|maletín
BROOCH|broche|broche
CABINET|armário|gabinete
CALENDAR|calendário|calendario
CAN|lata|lata
CANOPENER|abridor de latas|abrelatas
CARABINER|mosquetão|mosquetón
CARDBOARD|papelão|cartón
CELLO|violoncelo|violonchelo
CHISEL|cinzel|cincel
CLAMP|grampo|abrazadera
CLARINET|clarinete|clarinete
CLIP|clipe|clip
COFFEEMAKER|cafeteira|cafetera
COLANDER|escorredor|colador
CONSOLE|console|consola
CORKSCREW|saca-rolhas|sacacorchos
CRAYON|giz de cera|crayón
CROWBAR|pé de cabra|palanca
CUTTINGBOARD|tábua de corte|tabla de cortar
DEODORANT|desodorante|desodorante
DOORBELL|campainha|timbre
DOORKNOB|maçaneta|pomo
DRAWER|gaveta|cajón
DRESSER|cômoda|cómoda
DRYER|secadora|secadora
DUMBBELL|halter|mancuerna
DUSTPAN|pá de lixo|recogedor
EASEL|cavalete|caballete
EXTENSION|extensão elétrica|alargador
FIREPLACE|lareira|chimenea
FLASK|frasco|matraz
FLUTE|flauta|flauta
FREEZER|congelador|congelador
FUNNEL|funil|embudo
GAMEPAD|controle de videogame|mando de videojuegos
GARLAND|guirlanda|guirnalda
GRATER|ralador|rallador
HAIRBRUSH|escova de cabelo|cepillo de pelo
HAIRDRYER|secador de cabelo|secador de pelo
HARMONICA|gaita|armónica
HARP|harpa|arpa
HOSE|mangueira|manguera
INK|tinta|tinta
JOYSTICK|joystick|palanca de mando
KETTLE|chaleira|hervidor
LADLE|concha|cucharón
LANTERN|lampião|farol
LOCKER|armário escolar|casillero
LOOM|tear|telar
MARKER|marcador|rotulador
MATTRESS|colchão|colchón
MEASURINGCUP|copo medidor|taza medidora
MICROWAVE|micro-ondas|microondas
MIXER|batedeira|batidora
MODEM|modem|módem
OPENER|abridor|abridor
PAINTBRUSH|pincel|pincel
PAPERCLIP|clipe de papel|clip de papel
PEELER|descascador|pelador
PEN|caneta|bolígrafo
PENDANT|pingente|colgante
PLANTER|vaso de planta|maceta
PLIERS|alicate|alicates
PROJECTOR|projetor|proyector
ROUTER|roteador|enrutador
SAFETYGLASSES|óculos de proteção|gafas de seguridad
SAW|serrote|sierra
SCALE|balança|báscula
SHAMPOO|xampu|champú
SHARPENER|apontador|sacapuntas
SHOWER|chuveiro|ducha
SIEVE|peneira|tamiz
SOAP|sabonete|jabón
SOCKET|tomada|enchufe
SPATULA|espátula|espátula
SPONGE|esponja|esponja
STRAINER|coador|colador
SWITCH|interruptor|interruptor
SYRINGE|seringa|jeringa
TAPE|fita adesiva|cinta adhesiva
TEAPOT|bule|tetera
TENT|barraca|tienda
THERMOS|garrafa térmica|termo
THREAD|linha|hilo
TOILET|vaso sanitário|inodoro
TRIPOD|tripé|trípode
TRUMPET|trompete|trompeta
TWEEZERS|pinça|pinzas
VACUUM|aspirador|aspiradora
VIOLIN|violino|violín
WARDROBE|guarda-roupa|armario
WASHER|máquina de lavar|lavadora
WHISK|batedor|batidor
ABACUS|ábaco|ábaco
ACCORDION|acordeão|acordeón
ANVIL|bigorna|yunque
BADMINTON|peteca de badminton|volante de bádminton
BAROMETER|barômetro|barómetro
BEAKER|béquer|vaso de precipitados
BIB|babador|babero
BLACKBOARD|quadro-negro|pizarra
BOILER|caldeira|caldera
BOLT|parafuso|perno
BOOMERANG|bumerangue|bumerán
BOOTS|botas|botas
BOW|arco|arco
BREASTPUMP|bomba tira-leite|sacaleches
BUGLE|corneta|corneta
CALIPER|paquímetro|calibrador
CANTEEN|cantil|cantimplora
CASSETTE|fita cassete|casete
CAULDRON|caldeirão|caldero
CHALK|giz|tiza
CHANDELIER|lustre|candelabro
CHESSBOARD|tabuleiro de xadrez|tablero de ajedrez
CLEAVER|cutelo|cuchilla
CLOCKWORK|mecanismo de relógio|mecanismo de reloj
COMPRESSOR|compressor|compresor
CORSET|espartilho|corsé
CRADLE|berço|cuna
CRUTCH|muleta|muleta
CUPBOARD|armário|alacena
DART|dardo|dardo
DECANTER|decantador|decantador
DIAPER|fralda|pañal
DIVIDER|divisória|separador
DRONE|drone|dron
DRYINGRACK|varal|tendedero
DUCT|duto|conducto
EARPLUG|protetor auricular|tapón para oídos
EGGBEATER|batedor de ovos|batidor de huevos
FIREEXTINGUISHER|extintor|extintor
FISHINGROD|vara de pescar|caña de pescar
FLAG|bandeira|bandera
FOOTBALL|bola de futebol|balón de fútbol
GAVEL|martelo de juiz|mazo
GEAR|engrenagem|engranaje
GOGGLES|óculos de proteção|gafas protectoras
GRINDER|esmerilhadeira|amoladora
GYROSCOPE|giroscópio|giroscopio
HANDCUFFS|algemas|esposas
HARDHAT|capacete de segurança|casco de seguridad
HARNESS|arnês|arnés
HAYFORK|forquilha|horca
HIGHLIGHTER|marca-texto|resaltador
HOE|enxada|azada
HOURGLASS|ampulheta|reloj de arena
HUMIDIFIER|umidificador|humidificador
ICEPACK|bolsa de gelo|bolsa de hielo
INHALER|inalador|inhalador
KAYAK|caiaque|kayak
LEASH|coleira|correa
LIFEBUOY|boia salva-vidas|salvavidas
LUNCHBOX|lancheira|fiambrera
MAGNIFIER|lupa|lupa
MALLET|marreta|mazo
MEGAPHONE|megafone|megáfono
METRONOME|metrônomo|metrónomo
NAILCLIPPER|cortador de unhas|cortauñas
NAPKIN|guardanapo|servilleta
NEBULIZER|nebulizador|nebulizador
NUTCRACKER|quebra-nozes|cascanueces
OAR|remo|remo
PALETTE|paleta|paleta
PAPERWEIGHT|peso de papel|pisapapeles
PARACHUTE|paraquedas|paracaídas
PEDESTAL|pedestal|pedestal
PILLOWCASE|fronha|funda de almohada
PIPETTE|pipeta|pipeta
PITCHER|jarra|jarra
PLOW|arado|arado
POT|panela|olla
PUNCHER|furador de papel|perforadora
QUILT|colcha|edredón
RAKE|ancinho|rastrillo
REEL|carretel|carrete
RESPIRATOR|respirador|respirador
ROLLINGPIN|rolo de massa|rodillo
SANDPAPER|lixa|papel de lija
SAUCEPAN|panela|cazo
SCALPEL|bisturi|bisturí
SEATBELT|cinto de segurança|cinturón de seguridad
SKIPPINGROPE|corda de pular|comba
SLEEPINGBAG|saco de dormir|saco de dormir
SOLDERINGIRON|ferro de solda|soldador
STETHOSCOPE|estetoscópio|estetoscopio
STOPWATCH|cronômetro|cronómetro
SUCTIONCUP|ventosa|ventosa
SURFBOARD|prancha de surfe|tabla de surf
TACK|tachinha|chincheta
TAMBOURINE|pandeiro|pandereta
THIMBLE|dedal|dedal
TOOLBOX|caixa de ferramentas|caja de herramientas
TORCH|tocha|antorcha
TUNINGFORK|diapasão|diapasón
TYPEWRITER|máquina de escrever|máquina de escribir
USB|dispositivo USB|dispositivo USB
WALKER|andador|andador
WATERINGCAN|regador|regadera
WHEELBARROW|carrinho de mão|carretilla
YARN|fio de lã|hilo de lana
`.trim();

const words = source.split('\n').map(line => {
    const [word, portuguese, spanish] = line.split('|');
    return {
        word,
        translations: { 'pt-BR': [portuguese], 'es-ES': [spanish] },
        score: word.length * 10,
    };
}).sort((first, second) => first.word.localeCompare(second.word, 'en'));

const duplicates = words.filter((entry, index) => index > 0 && entry.word === words[index - 1].word);
if (duplicates.length) throw new Error(`Duplicate objects: ${duplicates.map(entry => entry.word).join(', ')}`);
if (words.length < 200) throw new Error(`Expected at least 200 objects, found ${words.length}`);

data.general.objects = { words };
const output = `${JSON.stringify(data, null, 2)}\n`;
writeFileSync(frontendPath, output);
writeFileSync(backendPath, output);
console.log(`Wrote ${words.length} objects from ${words[0].word} to ${words.at(-1).word}.`);

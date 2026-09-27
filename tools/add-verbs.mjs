import { readFileSync, writeFileSync } from 'node:fs';

const frontendPath = new URL('../script/data/words.json', import.meta.url);
const backendPath = new URL('../../lettering-backend/data/english/words.json', import.meta.url);
const data = JSON.parse(readFileSync(frontendPath, 'utf8'));

const originalBaseWords = new Set('BAKE,BARK,BEAT,BITE,BLEND,BLINK,BOIL,BOUNCE,BREAK,BREATHE,BUILD,BUY,CARRY,CATCH,CHASE,CHEER,CHEW,CHOP,CLAP,CLEAN,CLIMB,CLOSE,COOK,COUGH,CRAWL,CREEP,CRY,DANCE,DIVE,DRAG,DRAW,DREAM,DRINK,DRIVE,DROP,EAT,ESCAPE,FALL,FEEL,FIGHT,FIND,FIX,FLOAT,FLY,FORGIVE,FREEZE,FRY,GIVE,GLIDE,GRAB,GRILL,HEAR,HELP,HIDE,HIT,HOLD,HOP,HUG,HURRY,JUMP,KICK,KNOW,LAUGH,LEAP,LEARN,LIE,LIFT,LISTEN,LOOK,LOSE,LOVE,MAKE,MARCH,MELT,MIX,NOD,NOTICE,OPEN,PACK,PEEL,PLAY,POINT,POUR,PRAY,PULL,PUSH,READ,REPAIR,REST,ROAR,ROAST,RUN,RUSH,SCREAM,SCRUB,SEARCH,SEE,SEEK,SELL,SEND,SERVE,SHAKE,SHIVER,SHOUT,SIGH,SING,SINK,SIT,SKIP,SLEEP,SLICE,SLIDE,SMELL,SMILE,SNEEZE,SPEAK,SPILL,STAND,STARE,START,STIR,STOP,STUDY,SWALLOW,SWEEP,SWIM,TAKE,TALK,TASTE,TEACH,THINK,THROW,TOSS,TOUCH,TRAVEL,TREMBLE,WAIT,WAKE,WALK,WANDER,WASH,WATCH,WAVE,WEEP,WHISPER,WIN,WINK,WORK,WRITE,YAWN,YELL'.split(','));
const original = (data.general.verbs?.words ?? [])
    .filter((entry) => originalBaseWords.has(entry.word));
const words = new Map(
    original
        .filter(entry => !['FALLING', 'LEARNING'].includes(entry.word))
        .map(({ word, translations, score }) => [word, { word, translations, score }]),
);

const additions = [
    ['ACCEPT', 'aceitar', 'aceptar'], ['ACT', 'agir|atuar', 'actuar'],
    ['ADD', 'adicionar', 'añadir'], ['ADMIRE', 'admirar', 'admirar'],
    ['ADMIT', 'admitir', 'admitir'], ['ADVISE', 'aconselhar', 'aconsejar'],
    ['AGREE', 'concordar', 'estar de acuerdo'], ['ALLOW', 'permitir', 'permitir'],
    ['ANNOUNCE', 'anunciar', 'anunciar'], ['ANSWER', 'responder', 'responder'],
    ['APOLOGIZE', 'pedir desculpas', 'disculparse'], ['APPEAR', 'aparecer', 'aparecer'],
    ['APPLY', 'aplicar', 'aplicar'], ['ARGUE', 'discutir', 'discutir'],
    ['ARRIVE', 'chegar', 'llegar'], ['ASK', 'perguntar', 'preguntar'],
    ['ATTACK', 'atacar', 'atacar'], ['AVOID', 'evitar', 'evitar'],
    ['BECOME', 'tornar-se', 'convertirse'], ['BEHAVE', 'comportar-se', 'comportarse'],
    ['BELIEVE', 'acreditar', 'creer'], ['BELONG', 'pertencer', 'pertenecer'],
    ['BORROW', 'pegar emprestado', 'pedir prestado'], ['BRING', 'trazer', 'traer'],
    ['BRUSH', 'escovar', 'cepillar'], ['BURN', 'queimar', 'quemar'],
    ['BURY', 'enterrar', 'enterrar'], ['CALL', 'chamar|ligar', 'llamar'],
    ['CANCEL', 'cancelar', 'cancelar'], ['CARE', 'cuidar', 'cuidar'],
    ['CELEBRATE', 'celebrar', 'celebrar'], ['CHANGE', 'mudar', 'cambiar'],
    ['CHECK', 'verificar', 'comprobar'], ['CHOOSE', 'escolher', 'elegir'],
    ['COLLECT', 'coletar|recolher', 'recoger|coleccionar'], ['COMPARE', 'comparar', 'comparar'],
    ['COMPLAIN', 'reclamar', 'quejarse'], ['COMPLETE', 'completar', 'completar'],
    ['CONNECT', 'conectar', 'conectar'], ['CONSIDER', 'considerar', 'considerar'],
    ['CONTINUE', 'continuar', 'continuar'], ['COPY', 'copiar', 'copiar'],
    ['COUNT', 'contar', 'contar'], ['COVER', 'cobrir', 'cubrir'],
    ['CREATE', 'criar', 'crear'], ['CROSS', 'atravessar|cruzar', 'cruzar'],
    ['CUT', 'cortar', 'cortar'], ['DECIDE', 'decidir', 'decidir'],
    ['DELIVER', 'entregar', 'entregar'], ['DEPEND', 'depender', 'depender'],
    ['DESCRIBE', 'descrever', 'describir'], ['DESTROY', 'destruir', 'destruir'],
    ['DEVELOP', 'desenvolver', 'desarrollar'], ['DIE', 'morrer', 'morir'],
    ['DISCOVER', 'descobrir', 'descubrir'], ['DISCUSS', 'debater|discutir', 'debatir|discutir'],
    ['DOUBT', 'duvidar', 'dudar'], ['DOWNLOAD', 'baixar', 'descargar'],
    ['EARN', 'ganhar', 'ganar'], ['ENJOY', 'aproveitar|gostar', 'disfrutar'],
    ['ENTER', 'entrar', 'entrar'], ['EXIST', 'existir', 'existir'],
    ['EXPLAIN', 'explicar', 'explicar'], ['EXPLORE', 'explorar', 'explorar'],
    ['FACE', 'enfrentar', 'afrontar'], ['FAIL', 'falhar|fracassar', 'fallar|fracasar'],
    ['FEED', 'alimentar', 'alimentar'], ['FILL', 'preencher|encher', 'llenar'],
    ['FINISH', 'terminar', 'terminar'], ['FOLLOW', 'seguir', 'seguir'],
    ['FORCE', 'forçar', 'forzar|obligar'], ['FORGET', 'esquecer', 'olvidar'],
    ['GROW', 'crescer|cultivar', 'crecer|cultivar'], ['GUESS', 'adivinhar', 'adivinar'],
    ['HAPPEN', 'acontecer', 'suceder'], ['HATE', 'odiar', 'odiar'],
    ['HOPE', 'esperar', 'esperar'], ['IMAGINE', 'imaginar', 'imaginar'],
    ['IMPROVE', 'melhorar', 'mejorar'], ['INCLUDE', 'incluir', 'incluir'],
    ['INTRODUCE', 'apresentar|introduzir', 'presentar|introducir'], ['INVITE', 'convidar', 'invitar'],
    ['JOIN', 'juntar-se|unir-se', 'unirse'], ['KEEP', 'manter|guardar', 'mantener|guardar'],
    ['KILL', 'matar', 'matar'], ['KISS', 'beijar', 'besar'],
    ['LAND', 'pousar', 'aterrizar'], ['LEAVE', 'sair|deixar', 'salir|dejar'],
    ['LEND', 'emprestar', 'prestar'], ['LIKE', 'gostar', 'gustar'],
    ['LIVE', 'viver', 'vivir'], ['LOAD', 'carregar', 'cargar'],
    ['LOCK', 'trancar', 'cerrar con llave'], ['MANAGE', 'gerenciar|conseguir', 'gestionar|lograr'],
    ['MEASURE', 'medir', 'medir'], ['MEET', 'conhecer|encontrar', 'conocer|encontrarse'],
    ['MISS', 'sentir falta|perder', 'extrañar|perder'], ['MOVE', 'mover|mudar', 'mover|mudarse'],
    ['NEED', 'precisar', 'necesitar'], ['OCCUR', 'ocorrer', 'ocurrir'],
    ['OFFER', 'oferecer', 'ofrecer'], ['ORDER', 'ordenar|pedir', 'ordenar|pedir'],
    ['OWN', 'possuir', 'poseer'], ['PAINT', 'pintar', 'pintar'],
    ['PASS', 'passar', 'pasar'], ['PAY', 'pagar', 'pagar'],
    ['PICK', 'escolher|pegar', 'elegir|recoger'], ['PLAN', 'planejar', 'planear'],
    ['PLANT', 'plantar', 'plantar'], ['PRACTICE', 'praticar', 'practicar'],
    ['PREFER', 'preferir', 'preferir'], ['PREPARE', 'preparar', 'preparar'],
    ['PRINT', 'imprimir', 'imprimir'], ['PROMISE', 'prometer', 'prometer'],
    ['PROTECT', 'proteger', 'proteger'], ['REACH', 'alcançar', 'alcanzar|llegar'],
    ['RECEIVE', 'receber', 'recibir'], ['REMEMBER', 'lembrar', 'recordar'],
    ['REMOVE', 'remover|retirar', 'quitar|retirar'], ['REPEAT', 'repetir', 'repetir'],
    ['REPLACE', 'substituir', 'reemplazar'], ['RETURN', 'retornar|devolver', 'regresar|devolver'],
    ['RIDE', 'cavalgar|andar', 'montar'], ['ROLL', 'rolar', 'rodar'],
    ['SAVE', 'salvar|economizar', 'guardar|ahorrar'], ['SAY', 'dizer', 'decir'],
    ['SEEM', 'parecer', 'parecer'], ['SHARE', 'compartilhar', 'compartir'],
    ['SHOW', 'mostrar', 'mostrar'], ['SHUT', 'fechar', 'cerrar'],
    ['SIGN', 'assinar', 'firmar'], ['SOLVE', 'resolver', 'resolver'],
    ['SPEND', 'gastar|passar', 'gastar|pasar'], ['STAY', 'ficar|permanecer', 'quedarse|permanecer'],
    ['STEAL', 'roubar', 'robar'], ['STEP', 'pisar|dar um passo', 'pisar|dar un paso'],
    ['SUGGEST', 'sugerir', 'sugerir'], ['SUPPORT', 'apoiar', 'apoyar'],
    ['TRY', 'tentar', 'intentar'], ['TURN', 'virar|girar', 'girar'],
    ['TYPE', 'digitar', 'teclear'], ['UNDERSTAND', 'entender', 'comprender'],
    ['USE', 'usar', 'usar'], ['VISIT', 'visitar', 'visitar'],
    ['VOTE', 'votar', 'votar'], ['WANT', 'querer', 'querer'],
    ['WEAR', 'vestir|usar', 'llevar|vestir'], ['WISH', 'desejar', 'desear'],
    ['WONDER', 'perguntar-se', 'preguntarse'],
    ['ABANDON', 'abandonar', 'abandonar'], ['ACCUSE', 'acusar', 'acusar'],
    ['ADOPT', 'adotar', 'adoptar'], ['BLESS', 'abençoar', 'bendecir'],
    ['BOAST', 'gabar-se', 'presumir'], ['CHARGE', 'cobrar', 'cobrar'],
    ['COMB', 'pentear', 'peinar'], ['COMMAND', 'comandar', 'comandar'],
    ['CRASH', 'colidir', 'chocar'], ['DECORATE', 'decorar', 'decorar'],
    ['DELAY', 'atrasar', 'retrasar'], ['DIG', 'cavar', 'cavar'],
    ['DIVIDE', 'dividir', 'dividir'], ['DRESS', 'vestir', 'vestir'],
    ['DRILL', 'perfurar', 'perforar'], ['END', 'terminar', 'terminar'],
    ['EXPAND', 'expandir', 'expandir'], ['FEAR', 'temer', 'temer'],
    ['FETCH', 'buscar', 'buscar'], ['FOLD', 'dobrar', 'doblar'],
    ['GATHER', 'reunir', 'reunir'], ['GREET', 'cumprimentar', 'saludar'],
    ['GUIDE', 'guiar', 'guiar'], ['HAMMER', 'martelar', 'martillar'],
    ['HUNT', 'caçar', 'cazar'], ['IDENTIFY', 'identificar', 'identificar'],
    ['KNOCK', 'bater', 'golpear'], ['MAIL', 'enviar', 'enviar'],
    ['MARRY', 'casar', 'casarse'], ['MOP', 'esfregar', 'fregar'],
    ['OBEY', 'obedecer', 'obedecer'], ['PARK', 'estacionar', 'estacionar'],
    ['PRESS', 'pressionar', 'presionar'], ['PUNCH', 'socar', 'golpear'],
    ['RECYCLE', 'reciclar', 'reciclar'], ['RELAX', 'relaxar', 'relajarse'],
    ['RELEASE', 'liberar', 'liberar'], ['ROW', 'remar', 'remar'],
    ['SAIL', 'velejar', 'navegar'], ['SKATE', 'patinar', 'patinar'],
    ['SKI', 'esquiar', 'esquiar'], ['SMOKE', 'fumar', 'fumar'],
    ['SNORE', 'roncar', 'roncar'], ['SPRAY', 'borrifar', 'rociar'],
    ['SQUEEZE', 'espremer', 'exprimir'], ['TIE', 'amarrar', 'atar'],
    ['TRAIN', 'treinar', 'entrenar'], ['UNLOCK', 'destrancar', 'desbloquear'],
    ['WRAP', 'embrulhar', 'envolver'],
    ['ACHIEVE', 'alcançar|conquistar', 'alcanzar|lograr'], ['ANALYZE', 'analisar', 'analizar'],
    ['APPROACH', 'aproximar-se|abordar', 'acercarse|abordar'], ['ATTEND', 'comparecer|frequentar', 'asistir'],
    ['CLARIFY', 'esclarecer', 'aclarar'], ['COMMUNICATE', 'comunicar', 'comunicar'],
    ['COOPERATE', 'cooperar', 'cooperar'], ['DESIGN', 'projetar', 'diseñar'],
    ['ENABLE', 'permitir|habilitar', 'permitir|habilitar'], ['ENCOURAGE', 'incentivar', 'animar'],
    ['EXAMINE', 'examinar', 'examinar'], ['EXPECT', 'esperar', 'esperar'],
    ['EXPERIENCE', 'vivenciar|experimentar', 'experimentar'], ['EXPRESS', 'expressar', 'expresar'],
    ['FOCUS', 'focar', 'enfocar'], ['GLANCE', 'olhar rapidamente', 'mirar rápidamente'],
    ['HANDLE', 'lidar com|manusear', 'manejar|lidiar con'], ['INCREASE', 'aumentar', 'aumentar'],
    ['INFORM', 'informar', 'informar'], ['LAUNCH', 'lançar', 'lanzar'],
    ['MENTION', 'mencionar', 'mencionar'], ['OBSERVE', 'observar', 'observar'],
    ['ORGANIZE', 'organizar', 'organizar'], ['PEEK', 'espiar|dar uma olhada', 'espiar|echar un vistazo'],
    ['PEER', 'espiar|olhar atentamente', 'escudriñar|mirar atentamente'], ['PERFORM', 'realizar|atuar', 'realizar|actuar'],
    ['PROVIDE', 'fornecer', 'proporcionar'], ['RECORD', 'gravar|registrar', 'grabar|registrar'],
    ['REPORT', 'relatar|informar', 'informar|reportar'], ['RESPOND', 'responder', 'responder'],
    ['REVIEW', 'revisar', 'revisar'], ['SELECT', 'selecionar', 'seleccionar'],
    ['TEST', 'testar', 'probar'], ['UPDATE', 'atualizar', 'actualizar'],
    ['UPLOAD', 'enviar|carregar', 'subir|cargar'], ['VERIFY', 'verificar', 'verificar'],
    ['WARN', 'avisar|alertar', 'avisar|advertir'],
    ['BEND', 'dobrar|curvar', 'doblar|curvar'], ['BLOW', 'soprar', 'soplar'],
    ['CHAT', 'conversar', 'charlar'], ['CLIP', 'prender|recortar', 'sujetar|recortar'],
    ['DIP', 'mergulhar|molhar', 'sumergir|mojar'], ['DRIP', 'pingar', 'gotear'],
    ['DRY', 'secar', 'secar'], ['EMPTY', 'esvaziar', 'vaciar'],
    ['GRIN', 'sorrir', 'sonreír'], ['HAND', 'entregar|passar', 'entregar|pasar'],
    ['IRON', 'passar roupa', 'planchar'], ['JOG', 'correr devagar', 'trotar'],
    ['LICK', 'lamber', 'lamer'], ['POKE', 'cutucar', 'pinchar|tocar'],
    ['POLISH', 'polir', 'pulir'], ['RINSE', 'enxaguar', 'enjuagar'],
    ['RUB', 'esfregar', 'frotar'], ['SCOOP', 'recolher|pegar com uma concha', 'recoger|sacar con una cuchara'],
    ['SCRATCH', 'coçar|arranhar', 'rascar|arañar'], ['SIP', 'bebericar|tomar um gole', 'sorber|tomar un sorbo'],
    ['SOAK', 'encharcar|deixar de molho', 'empapar|poner en remojo'], ['SPIN', 'girar', 'girar'],
    ['SPLASH', 'respingar', 'salpicar'], ['STACK', 'empilhar', 'apilar'],
    ['STRETCH', 'alongar|esticar', 'estirar'], ['TAP', 'tocar levemente', 'tocar suavemente'],
    ['TICKLE', 'fazer cócegas', 'hacer cosquillas'], ['TRIP', 'tropeçar', 'tropezar'],
    ['WIPE', 'limpar|enxugar', 'limpiar|secar'], ['ZIP', 'fechar o zíper', 'cerrar la cremallera'],
    ['ARISE', 'surgir|levantar-se', 'surgir|levantarse'], ['AWAKE', 'acordar', 'despertar'],
    ['BE', 'ser|estar', 'ser|estar'], ['BEAR', 'suportar|carregar', 'soportar|cargar'],
    ['BEGIN', 'começar', 'empezar'], ['BET', 'apostar', 'apostar'],
    ['BLEED', 'sangrar', 'sangrar'], ['BURST', 'estourar', 'estallar'],
    ['CAN', 'poder', 'poder'], ['COME', 'vir', 'venir'],
    ['COST', 'custar', 'costar'], ['DEAL', 'lidar|negociar', 'lidiar|negociar'],
    ['DO', 'fazer', 'hacer'], ['FIT', 'caber|ajustar', 'caber|ajustar'],
    ['FORBID', 'proibir', 'prohibir'], ['GET', 'obter|conseguir', 'obtener|conseguir'],
    ['GO', 'ir', 'ir'], ['HANG', 'pendurar', 'colgar'],
    ['HAVE', 'ter', 'tener'], ['HURT', 'machucar|doer', 'lastimar|doler'],
    ['LEAD', 'liderar|conduzir', 'liderar|conducir'], ['LET', 'deixar|permitir', 'dejar|permitir'],
    ['LIGHT', 'acender|iluminar', 'encender|iluminar'], ['MEAN', 'significar', 'significar'],
    ['PUT', 'colocar', 'poner'], ['RING', 'tocar|telefonar', 'sonar|llamar'],
    ['RISE', 'subir|levantar-se', 'subir|levantarse'], ['SET', 'definir|colocar', 'establecer|colocar'],
    ['SHINE', 'brilhar', 'brillar'], ['SHOOT', 'atirar|filmar', 'disparar|filmar'],
    ['STICK', 'colar|grudar', 'pegar|adherir'], ['STING', 'picar', 'picar'],
    ['STRIKE', 'atingir|golpear', 'golpear'], ['SWEAR', 'jurar', 'jurar'],
    ['TEAR', 'rasgar', 'romper'], ['TELL', 'contar|dizer', 'contar|decir'],
    ['AFFORD', 'poder pagar', 'poder pagar'], ['CALCULATE', 'calcular', 'calcular'],
    ['CONTAIN', 'conter', 'contener'], ['CONTROL', 'controlar', 'controlar'],
    ['DISAPPEAR', 'desaparecer', 'desaparecer'], ['EXPLODE', 'explodir', 'explotar'],
    ['ACCOMPANY', 'acompanhar', 'acompañar'], ['ACKNOWLEDGE', 'reconhecer', 'reconocer'],
    ['ACQUIRE', 'adquirir', 'adquirir'], ['ADAPT', 'adaptar', 'adaptar'],
    ['ADDRESS', 'abordar|endereçar', 'abordar|dirigir'], ['ADJUST', 'ajustar', 'ajustar'],
    ['AFFECT', 'afetar', 'afectar'], ['AIM', 'mirar|ter como objetivo', 'apuntar|tener como objetivo'],
    ['ALTER', 'alterar', 'alterar'], ['AMUSE', 'divertir', 'divertir'],
    ['APPRECIATE', 'apreciar|agradecer', 'apreciar|agradecer'], ['APPROVE', 'aprovar', 'aprobar'],
    ['ARRANGE', 'organizar|combinar', 'organizar|acordar'], ['ARREST', 'prender', 'arrestar'],
    ['ATTACH', 'anexar|prender', 'adjuntar|sujetar'], ['ATTEMPT', 'tentar', 'intentar'],
    ['ATTRACT', 'atrair', 'atraer'], ['BALANCE', 'equilibrar', 'equilibrar'],
    ['BAN', 'proibir', 'prohibir'], ['BATHE', 'banhar-se', 'bañarse'],
    ['BLAME', 'culpar', 'culpar'], ['BLOCK', 'bloquear', 'bloquear'],
    ['BOOK', 'reservar', 'reservar'], ['BOTHER', 'incomodar', 'molestar'],
    ['CAUSE', 'causar', 'causar'], ['CHALLENGE', 'desafiar', 'desafiar'],
    ['CLAIM', 'afirmar|reivindicar', 'afirmar|reclamar'], ['COMBINE', 'combinar', 'combinar'],
    ['COMMIT', 'comprometer-se', 'comprometerse'], ['CONCENTRATE', 'concentrar-se', 'concentrarse'],
    ['CONCERN', 'preocupar|dizer respeito', 'preocupar|concernir'], ['CONFIRM', 'confirmar', 'confirmar'],
    ['CONSIST', 'consistir', 'consistir'], ['CONTACT', 'contatar', 'contactar'],
    ['CONTRIBUTE', 'contribuir', 'contribuir'], ['CONVINCE', 'convencer', 'convencer'],
    ['CORRECT', 'corrigir', 'corregir'], ['DAMAGE', 'danificar', 'dañar'],
    ['DARE', 'ousar|atrever-se', 'atreverse'], ['DECLINE', 'recusar|diminuir', 'rechazar|disminuir'],
    ['DECREASE', 'diminuir', 'disminuir'], ['DEMAND', 'exigir', 'exigir'],
    ['DENY', 'negar', 'negar'], ['DESERVE', 'merecer', 'merecer'],
    ['DETERMINE', 'determinar', 'determinar'], ['DIRECT', 'dirigir', 'dirigir'],
    ['DISAGREE', 'discordar', 'discrepar'], ['ENGAGE', 'envolver|engajar', 'involucrar'],
    ['ESTABLISH', 'estabelecer', 'establecer'], ['ESTIMATE', 'estimar', 'estimar'],
    ['EXCHANGE', 'trocar', 'intercambiar'], ['EXERCISE', 'exercitar-se', 'ejercitarse'],
    ['EXTEND', 'estender', 'extender'], ['GAIN', 'ganhar|obter', 'ganar|obtener'],
    ['GUARD', 'proteger|vigiar', 'proteger|vigilar'], ['INDICATE', 'indicar', 'indicar'],
    ['INFLUENCE', 'influenciar', 'influir'], ['INSIST', 'insistir', 'insistir'],
    ['INTEND', 'pretender', 'tener la intención'], ['INTERRUPT', 'interromper', 'interrumpir'],
    ['INVOLVE', 'envolver', 'involucrar'], ['MATTER', 'importar', 'importar'],
    ['MIND', 'importar-se|cuidar', 'importar|cuidar'], ['NAME', 'nomear', 'nombrar'],
    ['NOTE', 'observar|anotar', 'observar|anotar'], ['OBTAIN', 'obter', 'obtener'],
    ['PREVENT', 'impedir|prevenir', 'impedir|prevenir'], ['PRODUCE', 'produzir', 'producir'],
    ['PROVE', 'provar', 'probar'], ['RAISE', 'levantar|aumentar', 'levantar|aumentar'],
    ['REALIZE', 'perceber|realizar', 'darse cuenta|realizar'], ['RECOGNIZE', 'reconhecer', 'reconocer'],
    ['REDUCE', 'reduzir', 'reducir'], ['REFUSE', 'recusar', 'rechazar'],
    ['RELATE', 'relacionar|relatar', 'relacionar|relatar'], ['REMAIN', 'permanecer', 'permanecer'],
    ['REQUIRE', 'exigir|requerer', 'exigir|requerir'], ['REVEAL', 'revelar', 'revelar'],
    ['RISK', 'arriscar', 'arriesgar'], ['SEPARATE', 'separar', 'separar'],
    ['SETTLE', 'resolver|estabelecer-se', 'resolver|establecerse'], ['SORT', 'ordenar|classificar', 'ordenar|clasificar'],
    ['SOUND', 'soar|parecer', 'sonar|parecer'], ['SUFFER', 'sofrer', 'sufrir'],
    ['SUPPOSE', 'supor', 'suponer'], ['SURPRISE', 'surpreender', 'sorprender'],
    ['SURVIVE', 'sobreviver', 'sobrevivir'], ['THANK', 'agradecer', 'agradecer'],
    ['TREAT', 'tratar', 'tratar'], ['TRUST', 'confiar', 'confiar'],
];

for (const [word, portuguese, spanish] of additions) {
    if (words.has(word)) continue;
    words.set(word, {
        word,
        translations: {
            'pt-BR': portuguese.split('|'),
            'es-ES': spanish.split('|'),
        },
        score: word.length * 10,
    });
}

const corrections = {
    DREAM: { 'pt-BR': ['sonhar'], 'es-ES': ['soñar'] },
    FALL: { 'pt-BR': ['cair'], 'es-ES': ['caer'] },
    LIE: { 'pt-BR': ['deitar', 'mentir'], 'es-ES': ['acostarse', 'mentir'] },
    LOVE: { 'pt-BR': ['amar'], 'es-ES': ['amar'] },
    PLAY: { 'pt-BR': ['jogar', 'brincar', 'tocar'], 'es-ES': ['jugar', 'tocar'] },
    SMILE: { 'pt-BR': ['sorrir'], 'es-ES': ['sonreír'] },
    WATCH: { 'pt-BR': ['assistir', 'observar'], 'es-ES': ['mirar', 'observar'] },
    WRITE: { 'pt-BR': ['escrever'], 'es-ES': ['escribir'] },
};
for (const [word, translations] of Object.entries(corrections)) words.get(word).translations = translations;

const doubledFinalConsonant = new Set([
    'ADMIT', 'BEGIN', 'BET', 'CHOP', 'CLAP', 'CUT', 'DIG', 'DRAG', 'DROP', 'FORBID', 'GET', 'GRAB',
    'HIT', 'HOP', 'HUG', 'LET', 'MOP', 'NOD', 'PUT',
    'BAN', 'CHAT', 'CLIP', 'COMMIT', 'CONTROL', 'DIP', 'DRIP', 'FIT', 'GRIN', 'JOG', 'OCCUR',
    'PLAN', 'PREFER', 'RUB', 'RUN', 'SCRUB',
    'SET', 'SHUT', 'SIP', 'SKIP', 'SPIN', 'STEP', 'STIR', 'STOP', 'SWIM', 'TAP', 'TRIP', 'WIN', 'WRAP', 'ZIP',
]);

function thirdPerson(word) {
    if (word === 'HAVE') return 'HAS';
    if (/[^AEIOU]Y$/.test(word)) return word.slice(0, -1) + 'IES';
    if (/(S|X|Z|CH|SH|O)$/.test(word)) return word + 'ES';
    return word + 'S';
}

function regularPast(word) {
    if (/[^AEIOU]Y$/.test(word)) return word.slice(0, -1) + 'IED';
    if (word.endsWith('E')) return word + 'D';
    if (doubledFinalConsonant.has(word)) return word + word.at(-1) + 'ED';
    return word + 'ED';
}

function presentParticiple(word) {
    if (word.endsWith('IE')) return word.slice(0, -2) + 'YING';
    if (word.endsWith('E') && !word.endsWith('EE')) return word.slice(0, -1) + 'ING';
    if (doubledFinalConsonant.has(word)) return word + word.at(-1) + 'ING';
    return word + 'ING';
}

const irregular = {
    ARISE: ['AROSE', 'ARISEN'], AWAKE: ['AWOKE', 'AWOKEN'], BEAR: ['BORE', 'BORNE'],
    BEAT: ['BEAT', 'BEATEN'], BECOME: ['BECAME', 'BECOME'], BEGIN: ['BEGAN', 'BEGUN'],
    BEND: ['BENT', 'BENT'], BET: ['BET', 'BET'], BITE: ['BIT', 'BITTEN'], BLEED: ['BLED', 'BLED'],
    BLOW: ['BLEW', 'BLOWN'],
    BREAK: ['BROKE', 'BROKEN'], BRING: ['BROUGHT', 'BROUGHT'], BUILD: ['BUILT', 'BUILT'], BURST: ['BURST', 'BURST'],
    BUY: ['BOUGHT', 'BOUGHT'], CATCH: ['CAUGHT', 'CAUGHT'], CHOOSE: ['CHOSE', 'CHOSEN'],
    COME: ['CAME', 'COME'], COST: ['COST', 'COST'], CREEP: ['CREPT', 'CREPT'], CUT: ['CUT', 'CUT'],
    DEAL: ['DEALT', 'DEALT'], DO: ['DID', 'DONE'], DRAW: ['DREW', 'DRAWN'],
    DRINK: ['DRANK', 'DRUNK'], DRIVE: ['DROVE', 'DRIVEN'], EAT: ['ATE', 'EATEN'],
    DIG: ['DUG', 'DUG'],
    FALL: ['FELL', 'FALLEN'], FIT: ['FIT', 'FIT'], FORBID: ['FORBADE', 'FORBIDDEN'],
    FAIL: ['FAILED', 'FAILED'],
    FEED: ['FED', 'FED'],
    FEEL: ['FELT', 'FELT'],
    FIND: ['FOUND', 'FOUND'],
    FLY: ['FLEW', 'FLOWN'],
    GET: ['GOT', 'GOTTEN'], GIVE: ['GAVE', 'GIVEN'], GO: ['WENT', 'GONE'],
    GROW: ['GREW', 'GROWN'],
    HANG: ['HUNG', 'HUNG'], HAVE: ['HAD', 'HAD'], HEAR: ['HEARD', 'HEARD'], HURT: ['HURT', 'HURT'],
    KEEP: ['KEPT', 'KEPT'],
    LEAD: ['LED', 'LED'], LEAVE: ['LEFT', 'LEFT'], LET: ['LET', 'LET'], LIGHT: ['LIT', 'LIT'],
    MAKE: ['MADE', 'MADE'], MEAN: ['MEANT', 'MEANT'],
    PAY: ['PAID', 'PAID'],
    PROVE: ['PROVED', 'PROVEN'], PUT: ['PUT', 'PUT'], READ: ['READ', 'READ'],
    RING: ['RANG', 'RUNG'], RISE: ['ROSE', 'RISEN'],
    RUN: ['RAN', 'RUN'],
    SAY: ['SAID', 'SAID'],
    SEE: ['SAW', 'SEEN'], SET: ['SET', 'SET'], SHINE: ['SHONE', 'SHONE'], SHOOT: ['SHOT', 'SHOT'],
    SPIN: ['SPUN', 'SPUN'],
    STICK: ['STUCK', 'STUCK'], STING: ['STUNG', 'STUNG'], STRIKE: ['STRUCK', 'STRUCK'], SWEAR: ['SWORE', 'SWORN'],
    TAKE: ['TOOK', 'TAKEN'],
    TEAR: ['TORE', 'TORN'], TELL: ['TOLD', 'TOLD'], THINK: ['THOUGHT', 'THOUGHT'],
    WEAR: ['WORE', 'WORN'],
    WIN: ['WON', 'WON'],
    WRITE: ['WROTE', 'WRITTEN'],
};

function verbForms(word) {
    if (word === 'LIE') return ['LIES', 'LAY', 'LAIN', 'LIED', 'LYING'];
    const past = irregular[word]?.[0] ?? regularPast(word);
    const participle = irregular[word]?.[1] ?? past;
    return [...new Set([thirdPerson(word), past, participle, presentParticiple(word)])]
        .filter((form) => form !== word);
}

function conjugateRegularInfinitive(value, form, language) {
    const portugueseIrregular = {
        cair: { base: 'caio', third: 'cai', past: 'caí', participle: 'caído', gerund: 'caindo' },
        dizer: { base: 'digo', third: 'diz', past: 'disse', participle: 'dito', gerund: 'dizendo' },
        escrever: { base: 'escrevo', third: 'escreve', past: 'escrevi', participle: 'escrito', gerund: 'escrevendo' },
        fazer: { base: 'faço', third: 'faz', past: 'fiz', participle: 'feito', gerund: 'fazendo' },
        ler: { base: 'leio', third: 'lê', past: 'li', participle: 'lido', gerund: 'lendo' },
        ouvir: { base: 'ouço', third: 'ouve', past: 'ouvi', participle: 'ouvido', gerund: 'ouvindo' },
        pedir: { base: 'peço', third: 'pede', past: 'pedi', participle: 'pedido', gerund: 'pedindo' },
        pôr: { base: 'ponho', third: 'põe', past: 'pus', participle: 'posto', gerund: 'pondo' },
        saber: { base: 'sei', third: 'sabe', past: 'soube', participle: 'sabido', gerund: 'sabendo' },
        sair: { base: 'saio', third: 'sai', past: 'saí', participle: 'saído', gerund: 'saindo' },
        trazer: { base: 'trago', third: 'traz', past: 'trouxe', participle: 'trazido', gerund: 'trazendo' },
        ver: { base: 'vejo', third: 'vê', past: 'vi', participle: 'visto', gerund: 'vendo' },
        vir: { base: 'venho', third: 'vem', past: 'vim', participle: 'vindo', gerund: 'vindo' },
    };
    if (language === 'pt-BR' && portugueseIrregular[value]) return portugueseIrregular[value][form];

    const reflexiveSuffix = value.endsWith('-se') ? '-se' : '';
    const phrase = reflexiveSuffix ? value.slice(0, -3) : value;
    const [verb, ...rest] = phrase.split(' ');
    const ending = verb.slice(-2);
    const stem = verb.slice(0, -2);
    const suffixes = language === 'pt-BR'
        ? {
            ar: { base: 'o', third: 'a', past: 'ei', participle: 'ado', gerund: 'ando' },
            er: { base: 'o', third: 'e', past: 'i', participle: 'ido', gerund: 'endo' },
            ir: { base: 'o', third: 'e', past: 'i', participle: 'ido', gerund: 'indo' },
        }
        : {
            ar: { base: 'o', third: 'a', past: 'é', participle: 'ado', gerund: 'ando' },
            er: { base: 'o', third: 'e', past: 'í', participle: 'ido', gerund: 'iendo' },
            ir: { base: 'o', third: 'e', past: 'í', participle: 'ido', gerund: 'iendo' },
        };
    if (!suffixes[ending]) return value;

    let conjugated = stem + suffixes[ending][form];
    if (reflexiveSuffix) {
        conjugated = form === 'base' || form === 'past' ? `${conjugated}-me` : `${conjugated}-se`;
    }
    return [conjugated, ...rest].join(' ');
}

function conjugatedTranslations(entry, form) {
    return Object.fromEntries(Object.entries(entry.translations).map(([language, translations]) => [
        language,
        translations.map((translation) => conjugateRegularInfinitive(translation, form, language)),
    ]));
}

function verbVariants(word) {
    if (word === 'BE') return [
        { word: 'BE', form: 'base' }, { word: 'AM', form: 'base' }, { word: 'ARE', form: 'base' },
        { word: 'IS', form: 'third' }, { word: 'WAS', form: 'past' }, { word: 'WERE', form: 'past' },
        { word: 'BEEN', form: 'participle' }, { word: 'BEING', form: 'gerund' },
    ];
    if (word === 'CAN') return [
        { word: 'CAN', form: 'base' }, { word: 'COULD', form: 'past' },
    ];
    if (word === 'LIE') return [
        { word, form: 'base' }, { word: 'LIES', form: 'third' },
        { word: 'LAY', form: 'past' }, { word: 'LAIN', form: 'participle' },
        { word: 'LIED', form: 'past' }, { word: 'LYING', form: 'gerund' },
    ];
    const past = irregular[word]?.[0] ?? regularPast(word);
    const participle = irregular[word]?.[1] ?? past;
    return [
        { word, form: 'base' },
        { word: thirdPerson(word), form: 'third' },
        { word: past, form: 'past' },
        { word: participle, form: 'participle' },
        { word: presentParticiple(word), form: 'gerund' },
    ];
}

const baseVerbs = [...words.values()].sort((first, second) => first.word.localeCompare(second.word, 'en'));
if (baseVerbs.length < 300) throw new Error(`Expected at least 300 base verbs, found ${baseVerbs.length}`);

const expandedWords = new Map();
baseVerbs.forEach((entry) => {
    verbVariants(entry.word).forEach(({ word, form }) => {
        if (expandedWords.has(word)) return;
        expandedWords.set(word, {
            word,
            translations: conjugatedTranslations(entry, form),
            score: word.length * 10,
        });
    });
});
const sorted = [...expandedWords.values()].sort((first, second) => first.word.localeCompare(second.word, 'en'));

data.general.verbs = { words: sorted };
const output = `${JSON.stringify(data, null, 2)}\n`;
writeFileSync(frontendPath, output);
writeFileSync(backendPath, output);
console.log(`Wrote ${sorted.length} verb words from ${sorted[0].word} to ${sorted.at(-1).word}.`);

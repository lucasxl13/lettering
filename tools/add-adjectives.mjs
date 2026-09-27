import { readFileSync, writeFileSync } from 'node:fs';

const frontendPath = new URL('../script/data/words.json', import.meta.url);
const backendPath = new URL('../../lettering-backend/data/english/words.json', import.meta.url);
const data = JSON.parse(readFileSync(frontendPath, 'utf8'));

const adjectives = [
    ['ABLE', 'capaz', 'capaz'], ['ABSENT', 'ausente', 'ausente'], ['ACTIVE', 'ativo', 'activo'],
    ['ACTUAL', 'real', 'real'], ['AFRAID', 'com medo', 'asustado'], ['ALIVE', 'vivo', 'vivo'],
    ['ALONE', 'sozinho', 'solo'], ['AMAZING', 'incrível', 'increíble'], ['ANGRY', 'bravo', 'enojado'],
    ['ANXIOUS', 'ansioso', 'ansioso'], ['AVAILABLE', 'disponível', 'disponible'], ['AVERAGE', 'mediano', 'promedio'],
    ['AWFUL', 'horrível', 'horrible'], ['BAD', 'ruim', 'malo'], ['BASIC', 'básico', 'básico'],
    ['BEAUTIFUL', 'bonito', 'hermoso'], ['BIG', 'grande', 'grande'], ['BITTER', 'amargo', 'amargo'],
    ['BLACK', 'preto', 'negro'], ['BLIND', 'cego', 'ciego'], ['BLUE', 'azul', 'azul'],
    ['BOLD', 'ousado', 'audaz'], ['BORED', 'entediado', 'aburrido'], ['BORING', 'entediante', 'aburrido'],
    ['BRAVE', 'corajoso', 'valiente'], ['BRIGHT', 'brilhante', 'brillante'], ['BROKEN', 'quebrado', 'roto'],
    ['BROWN', 'marrom', 'marrón'], ['BUSY', 'ocupado', 'ocupado'], ['CALM', 'calmo', 'tranquilo'],
    ['CAREFUL', 'cuidadoso', 'cuidadoso'], ['CARELESS', 'descuidado', 'descuidado'], ['CHEAP', 'barato', 'barato'],
    ['CLEAN', 'limpo', 'limpio'], ['CLEAR', 'claro', 'claro'], ['CLEVER', 'esperto', 'listo'],
    ['CLOSE', 'próximo', 'cercano'], ['CLOUDY', 'nublado', 'nublado'], ['COLD', 'frio', 'frío'],
    ['COLORFUL', 'colorido', 'colorido'], ['COMFORTABLE', 'confortável', 'cómodo'], ['COMMON', 'comum', 'común'],
    ['COMPLETE', 'completo', 'completo'], ['COMPLEX', 'complexo', 'complejo'], ['CONFIDENT', 'confiante', 'seguro'],
    ['CONFUSED', 'confuso', 'confundido'], ['CONSCIOUS', 'consciente', 'consciente'], ['CORRECT', 'correto', 'correcto'],
    ['CRAZY', 'louco', 'loco'], ['CREATIVE', 'criativo', 'creativo'], ['CRUEL', 'cruel', 'cruel'],
    ['CURIOUS', 'curioso', 'curioso'], ['CUTE', 'fofo', 'lindo'], ['DANGEROUS', 'perigoso', 'peligroso'],
    ['DARK', 'escuro', 'oscuro'], ['DEAD', 'morto', 'muerto'], ['DEEP', 'profundo', 'profundo'],
    ['DELICIOUS', 'delicioso', 'delicioso'], ['DIFFERENT', 'diferente', 'diferente'], ['DIFFICULT', 'difícil', 'difícil'],
    ['DIRECT', 'direto', 'directo'], ['DIRTY', 'sujo', 'sucio'], ['DRY', 'seco', 'seco'],
    ['EARLY', 'cedo', 'temprano'], ['EASY', 'fácil', 'fácil'], ['EFFECTIVE', 'eficaz', 'eficaz'],
    ['EFFICIENT', 'eficiente', 'eficiente'], ['EMPTY', 'vazio', 'vacío'], ['ENORMOUS', 'enorme', 'enorme'],
    ['ENTIRE', 'inteiro', 'entero'], ['EQUAL', 'igual', 'igual'], ['ESSENTIAL', 'essencial', 'esencial'],
    ['EXCELLENT', 'excelente', 'excelente'], ['EXCITED', 'animado', 'emocionado'], ['EXPENSIVE', 'caro', 'caro'],
    ['EXTRA', 'extra', 'extra'], ['FAIR', 'justo', 'justo'], ['FALSE', 'falso', 'falso'],
    ['FAMILIAR', 'familiar', 'familiar'], ['FAMOUS', 'famoso', 'famoso'], ['FANCY', 'sofisticado', 'elegante'],
    ['FAR', 'distante', 'lejano'], ['FAST', 'rápido', 'rápido'], ['FAT', 'gordo', 'gordo'],
    ['FAVORITE', 'favorito', 'favorito'], ['FINAL', 'final', 'final'], ['FINE', 'bom', 'bien'],
    ['FIRM', 'firme', 'firme'], ['FLAT', 'plano', 'plano'], ['FLEXIBLE', 'flexível', 'flexible'],
    ['FOOLISH', 'tolo', 'tonto'], ['FOREIGN', 'estrangeiro', 'extranjero'], ['FORMAL', 'formal', 'formal'],
    ['FREE', 'livre', 'libre'], ['FRESH', 'fresco', 'fresco'], ['FRIENDLY', 'amigável', 'amigable'],
    ['FULL', 'cheio', 'lleno'], ['FUNNY', 'engraçado', 'divertido'], ['GENERAL', 'geral', 'general'],
    ['GENTLE', 'gentil', 'amable'], ['GLAD', 'contente', 'contento'], ['GLOBAL', 'global', 'global'],
    ['GOOD', 'bom', 'bueno'], ['GREAT', 'ótimo', 'genial'], ['GREEN', 'verde', 'verde'],
    ['GUILTY', 'culpado', 'culpable'], ['HANDSOME', 'bonito', 'guapo'], ['HAPPY', 'feliz', 'feliz'],
    ['HARD', 'difícil|duro', 'difícil|duro'], ['HEALTHY', 'saudável', 'saludable'], ['HEAVY', 'pesado', 'pesado'],
    ['HELPFUL', 'útil', 'útil'], ['HONEST', 'honesto', 'honesto'], ['HUGE', 'enorme', 'enorme'],
    ['HUNGRY', 'faminto', 'hambriento'], ['IMPORTANT', 'importante', 'importante'], ['IMPOSSIBLE', 'impossível', 'imposible'],
    ['INDEPENDENT', 'independente', 'independiente'], ['INNOCENT', 'inocente', 'inocente'], ['INTELLIGENT', 'inteligente', 'inteligente'],
    ['INTERESTING', 'interessante', 'interesante'], ['KIND', 'gentil', 'amable'], ['LARGE', 'grande', 'grande'],
    ['LAST', 'último', 'último'], ['LATE', 'atrasado', 'tarde'], ['LAZY', 'preguiçoso', 'perezoso'],
    ['LIGHT', 'leve', 'ligero'], ['LITTLE', 'pequeno', 'pequeño'], ['LOCAL', 'local', 'local'],
    ['LONELY', 'solitário', 'solitario'], ['LONG', 'longo', 'largo'], ['LOOSE', 'solto', 'suelto'],
    ['LOUD', 'barulhento', 'ruidoso'], ['LOVELY', 'adorável', 'encantador'], ['LUCKY', 'sortudo', 'afortunado'],
    ['MAIN', 'principal', 'principal'], ['MAJOR', 'principal', 'mayor'], ['MODERN', 'moderno', 'moderno'],
    ['NARROW', 'estreito', 'estrecho'], ['NASTY', 'desagradável', 'desagradable'], ['NATIONAL', 'nacional', 'nacional'],
    ['NATURAL', 'natural', 'natural'], ['NEAR', 'próximo', 'cercano'], ['NEAT', 'organizado', 'ordenado'],
    ['NECESSARY', 'necessário', 'necesario'], ['NERVOUS', 'nervoso', 'nervioso'], ['NEW', 'novo', 'nuevo'],
    ['NICE', 'agradável', 'agradable'], ['NORMAL', 'normal', 'normal'], ['OLD', 'velho', 'viejo'],
    ['OPEN', 'aberto', 'abierto'], ['ORANGE', 'laranja', 'naranja'], ['ORIGINAL', 'original', 'original'],
    ['PATIENT', 'paciente', 'paciente'], ['PERFECT', 'perfeito', 'perfecto'], ['PERSONAL', 'pessoal', 'personal'],
    ['PHYSICAL', 'físico', 'físico'], ['PLAIN', 'simples', 'sencillo'], ['PLEASANT', 'agradável', 'agradable'],
    ['POLITE', 'educado', 'educado'], ['POOR', 'pobre', 'pobre'], ['POPULAR', 'popular', 'popular'],
    ['POSITIVE', 'positivo', 'positivo'], ['POSSIBLE', 'possível', 'posible'], ['POWERFUL', 'poderoso', 'poderoso'],
    ['PRACTICAL', 'prático', 'práctico'], ['PRESENT', 'presente', 'presente'], ['PRIVATE', 'privado', 'privado'],
    ['PROBABLE', 'provável', 'probable'], ['PROFESSIONAL', 'profissional', 'profesional'], ['PROUD', 'orgulhoso', 'orgulloso'],
    ['PUBLIC', 'público', 'público'], ['PURE', 'puro', 'puro'], ['QUICK', 'rápido', 'rápido'],
    ['QUIET', 'quieto|silencioso', 'tranquilo|silencioso'], ['RARE', 'raro', 'raro'], ['RAW', 'cru', 'crudo'],
    ['READY', 'pronto', 'listo'], ['REAL', 'real', 'real'], ['RECENT', 'recente', 'reciente'],
    ['RED', 'vermelho', 'rojo'], ['REGULAR', 'regular', 'regular'], ['RESPONSIBLE', 'responsável', 'responsable'],
    ['RICH', 'rico', 'rico'], ['RIGHT', 'certo', 'correcto'], ['ROUGH', 'áspero', 'áspero'],
    ['ROUND', 'redondo', 'redondo'], ['SAD', 'triste', 'triste'], ['SAFE', 'seguro', 'seguro'],
    ['SALTY', 'salgado', 'salado'], ['SAME', 'mesmo', 'mismo'], ['SERIOUS', 'sério', 'serio'],
    ['SHARP', 'afiado', 'afilado'], ['SHORT', 'curto', 'corto'], ['SHY', 'tímido', 'tímido'],
    ['SICK', 'doente', 'enfermo'], ['SILENT', 'silencioso', 'silencioso'], ['SILLY', 'bobo', 'tonto'],
    ['SIMILAR', 'semelhante', 'similar'], ['SIMPLE', 'simples', 'simple'], ['SINGLE', 'único|solteiro', 'único|soltero'],
    ['SLOW', 'lento', 'lento'], ['SMALL', 'pequeno', 'pequeño'], ['SMART', 'inteligente', 'inteligente'],
    ['SMOOTH', 'liso', 'liso'], ['SOFT', 'macio', 'suave'], ['SOLID', 'sólido', 'sólido'],
    ['SORE', 'dolorido', 'adolorido'], ['SORRY', 'arrependido', 'arrepentido'], ['SOUR', 'azedo', 'ácido'],
    ['SPECIAL', 'especial', 'especial'], ['SPECIFIC', 'específico', 'específico'], ['STRANGE', 'estranho', 'extraño'],
    ['STRICT', 'rigoroso', 'estricto'], ['STRONG', 'forte', 'fuerte'], ['SUCCESSFUL', 'bem-sucedido', 'exitoso'],
    ['SUDDEN', 'repentino', 'repentino'], ['SURE', 'certo|seguro', 'seguro'], ['SWEET', 'doce', 'dulce'],
    ['TALL', 'alto', 'alto'], ['TASTY', 'saboroso', 'sabroso'], ['THICK', 'grosso', 'grueso'],
    ['THIN', 'fino|magro', 'fino|delgado'], ['THIRSTY', 'sedento', 'sediento'], ['TIDY', 'arrumado', 'ordenado'],
    ['TIGHT', 'apertado', 'ajustado'], ['TINY', 'minúsculo', 'diminuto'], ['TIRED', 'cansado', 'cansado'],
    ['TOUGH', 'resistente|difícil', 'duro|difícil'], ['TRUE', 'verdadeiro', 'verdadero'], ['UGLY', 'feio', 'feo'],
    ['UNABLE', 'incapaz', 'incapaz'], ['UNFAIR', 'injusto', 'injusto'], ['UNHAPPY', 'infeliz', 'infeliz'],
    ['UNIQUE', 'único', 'único'], ['UNITED', 'unido', 'unido'], ['UNUSUAL', 'incomum', 'inusual'],
    ['UPSET', 'chateado', 'molesto'], ['USEFUL', 'útil', 'útil'], ['USELESS', 'inútil', 'inútil'],
    ['VALUABLE', 'valioso', 'valioso'], ['WARM', 'morno|quente', 'cálido'], ['WEAK', 'fraco', 'débil'],
    ['WEALTHY', 'rico', 'adinerado'], ['WEIRD', 'esquisito', 'raro'], ['WET', 'molhado', 'mojado'],
    ['WHITE', 'branco', 'blanco'], ['WHOLE', 'inteiro', 'entero'], ['WIDE', 'largo', 'ancho'],
    ['WILD', 'selvagem', 'salvaje'], ['WISE', 'sábio', 'sabio'], ['WONDERFUL', 'maravilhoso', 'maravilloso'],
    ['WRONG', 'errado', 'incorrecto'], ['YELLOW', 'amarelo', 'amarillo'], ['YOUNG', 'jovem', 'joven'],
];

const words = adjectives.map(([word, portuguese, spanish]) => ({
    word,
    translations: {
        'pt-BR': portuguese.split('|'),
        'es-ES': spanish.split('|'),
    },
    score: word.length * 10,
})).sort((first, second) => first.word.localeCompare(second.word, 'en'));

const duplicates = words.filter((entry, index) => index > 0 && entry.word === words[index - 1].word);
if (duplicates.length) throw new Error(`Duplicate adjectives: ${duplicates.map(entry => entry.word).join(', ')}`);
if (words.length < 250) throw new Error(`Expected at least 250 adjectives, found ${words.length}`);

data.general.adjectives = { words };
const output = `${JSON.stringify(data, null, 2)}\n`;
writeFileSync(frontendPath, output);
writeFileSync(backendPath, output);
console.log(`Wrote ${words.length} adjectives from ${words[0].word} to ${words.at(-1).word}.`);

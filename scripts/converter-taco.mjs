import fs from 'node:fs'

const entrada = 'scripts/taco_CMVCol.csv'
const saida = 'scripts/alimentos.csv'

// Texto -> Número. NA vira vazio, Tr (traços) vira 0, vígula vira ponto
function numero(texto) {
    const t = (texto ?? '').trim()
    if (t === '' || t.toUpperCase() === 'NA') return ''
    if (t === 'Tr') return 0
    const n = Number(t.replace(',', '.'))
    return Number.isNaN(n) ? '' : Math.round(n * 100) / 100
}

// Coloca entre aspas (nomes têm vírgulas, como "Arroz, integral, cozido")
function csvTexto(t) {
    return '"' + String(t).replace(/"/g, '""') + '"'
}

// Lê o arquivo; se os acentos vierem quebrados, tenta a condificação do Windown
const buffer = fs.readFileSync(entrada)
let texto = buffer.toString('utf8')
if (texto.includes('\uFFFD')) {
    texto = new TextDecoder('windows-1252').decode(buffer)
}

const linhas = texto.replace(/^\uFEFF/, '').split(/\r?\n/)
const saidaLinhas = ['fonte,nome,categoria,kcal,proteina_g,carboidrato_g,gordura_g']
let ignoradas = 0

for (const linha of linhas) {
    if (!linha.trim()) continue

    const c = linha.split(';')

    // Só aceita linhas em que a 2° coluna é o número do alimento
    if(!/^\d+$/.test((c[1] ?? '').trim())) {
        ignoradas++
        continue
    }

    const kcal = numero(c[4])
    if(kcal === '') {
        ignoradas++
        continue
    }

    saidaLinhas.push(
        [
            csvTexto('TACO'),
            csvTexto(c[2].trim()),
            csvTexto(c[0].trim()),
            kcal,
            numero(c[6]), // proteína
            numero(c[9]), // carboidrato
            numero(c[7]), // gordura
        ].join(',')
    )
}

fs.writeFileSync(saida, saidaLinhas.join('\n'), 'utf8')

console.log('Alimentos gerados:', saidaLinhas.length -1)
console.log('Linhas ignoradas:', ignoradas)
console.log('Primeiras linhas do resultado:')
console.log(saidaLinhas.slice(0, 4).join('\n'))
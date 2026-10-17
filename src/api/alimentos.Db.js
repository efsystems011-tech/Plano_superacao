import { supabase } from "../supabaseClient";

// Minúsculo e sem acento, igual ao que o trigger grava em nome_busca
function normalizar(texto) {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
}

// Evita que % e _ digitados sejam tratados como curingas                                                            
function escapar(palavra) {
    return palavra.replace(/[\\%_]/g, '\\$&')
}

function num(valor) {
    return valor === null ? null : Number(valor)
}

export async function buscarAlimentos(termo) {
    const palavras = normalizar(termo).split(/\s+/).filter(Boolean)
    if (palavras.length === 0) return []

    let consulta = supabase
        .from('alimentos')
        .select('id,nome,categoria,fonte,kcal,proteina_g,carboidrato_g,gordura_g')
    
    // Cada palavra digitada precisa aparecer no nome (ex: "frango grelhado")
    for(const palavra of palavras) {
        consulta = consulta.ilike('nome_busca', `%${escapar(palavra)}%`)
    }

    const { data, error } = await consulta.order('nome').limit(30)

    if (error) {
        throw error
    }

    // Mesmo formato que a tela já espera
    return data.map((a) => ({
        codigo: a.id,
        nome: a.nome,
        marca: a.categoria || '',
        fonte: a.fonte,
        kcal: num(a.kcal),
        proteina: num(a.proteina_g),
        carboidrato: num(a.carboidrato_g),
        gordura: num(a.gordura_g),
    }))
}

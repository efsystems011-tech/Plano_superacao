const BASE = 'https://world.openfoodfacts.org/cgi/search.pl'

export async function buscarAlimentos(termo) {
    const params = new URLSearchParams({
        search_terms: termo,
        search_simple: '1',
        action: 'process',
        json: '1',
        page_size: '20',
        fields: 'code,product_name,brands,nutriments',
    })

    const resposta = await fetch(`${BASE}?${params}`)
    if(!resposta.ok) {
        throw new Error('Falha ao consultar a API')
    }

    const dados = await buscarComTentativa(`${BASE}?${params}`)

    return (dados.products || [])
        .filter((p) => p.product_name && p.nutriments)
        .map((p) => {
            const n = p.nutriments

            // Se não vier em kcal, converter de KJ (1 kcal = 4,184 : null)
            const kcal =
                n['energy-kcal_100g'] ??
                (n.energy_100g != null ? n.energy_100g / 4.184 : null)

            return {
                codigo: p.code,
                nome: p.product_name,
                marca: p.brands || '',
                kcal,
                proteina: n.proteins_100g ?? null,
                carboidrato: n.carbohydrates_100g ?? null,
                gordura: n.fat_100g ?? null,
            }
        })
        .filter((a) => a.kcal != null)
}

async function buscarComTentativa(url, tentativas = 2) {
    for (let i = 0; i < tentativas; i++) {
        try {
            const resposta = await fetch(url)
            if (resposta.ok) {
                return await resposta.json()
            }
        } catch (e) {
            // Erro de rede ou resposta sem CORS: vai tentar de novo
        }

        // Espera um pouco antes da próxima tentativa
        await new Promise((resolve) => setTimeout(resolve, 1500))
    }

    throw new Error('API indisponível')
}
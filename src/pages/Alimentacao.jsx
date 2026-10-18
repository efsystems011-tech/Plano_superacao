import { useState, useEffect } from "react"
import { supabase } from '../supabaseClient'
import { buscarAlimentos } from '../api/alimentos.Db'
import { useAuth } from '../AuthContext'

const REFEICOES = [
    { valor: 'cafe', nome: 'Café da manhã' },
    { valor: 'almoco', nome: 'Almoço' },
    { valor: 'jantar', nome: 'Jantar' },
    { valor: 'lanche', nome: 'Lanche' },
]

function formatar(valor) {
    if (valor == null)
        return '-'
    return Math.round(valor * 10) / 10
}

// Regra de três: valor por 100 g -> valor para a quantidade comida
function proporcional(valorPor100, gramas) {
    return ((valorPor100 ?? 0) * gramas) / 100
}

function arredondar(valor) {
    return Math.round(valor * 10) / 10
}

function Alimentacao() {
    const { user } = useAuth()
    const [termo, setTermo] = useState('')
    const [resultados, setResultados] = useState([])
    const [buscando, setBuscando] = useState(false)
    const [buscou, setBuscou] = useState(false)
    const [erro, setErro] = useState('')

    const [selecionado, setSelecionado] = useState(null)
    const [gramas, setGramas] = useState('100')
    const [refeicao, setRefeicao] = useState('lanche')
    const [salvando, setSalvando] = useState(false)

    const [registros, setRegistros] = useState([])
    const [carregandoRegistros, setCarregandoRegistros] = useState(true)

    useEffect(() => {
        let ativo = true

        async function carregarRegistros() {
            if (!user?.id) return

            const inicio = new Date()
            inicio.setHours(0, 0, 0, 0)

            const { data, error } = await supabase
                .from('food_logs')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', inicio.toISOString())
                .order('created_at', { ascending: false })

            if (!ativo) return
            if (error) {
                setErro(`Não foi possível carregar suas refeições: ${error.message}`)
            } else {
                setErro('')
                setRegistros(data)
            }
            setCarregandoRegistros(false)
        }

        carregarRegistros()
        return () => {
            ativo = false
        }
    }, [user])

    async function buscar(e) {
        e.preventDefault()
        if (!termo.trim()) return

        setErro('')
        setBuscando(true)
        try {
            const lista = await buscarAlimentos(termo.trim())
            setResultados(lista)
            setBuscou(true)
        } catch (err) {
            setResultados([])
            setBuscou(true)
            setErro(`Não foi possível buscar alimentos: ${err.message}`)
        } finally {
            setBuscando(false)
        }
    }

    function escolher(alimento) {
        setSelecionado(alimento)
        setGramas('100')
    }

    async function salvar(e) {
        e.preventDefault()

        const g = parseFloat(gramas)
        if (!g || g <= 0) return

        setErro('')
        setSalvando(true)

        const { data: registro, error } = await supabase
            .from('food_logs')
            .insert({
                user_id: user.id,
                food_name: selecionado.nome,
                brand: selecionado.marca || null,
                grams: g,
                kcal: arredondar(proporcional(selecionado.kcal, g)),
                protein_g: arredondar(proporcional(selecionado.proteina, g)),
                carbs_g: arredondar(proporcional(selecionado.carboidrato, g)),
                fat_g: arredondar(proporcional(selecionado.gordura, g)),
                meal_type: refeicao,
            })
            .select()
            .single()
        setSalvando(false)

        if (error) {
            setErro(`Não foi possível salvar a refeição: ${error.message}`)
            return
        }

        setRegistros((atuais) => [registro, ...atuais])
        setSelecionado(null)
        setGramas('100')
    }

    async function remover(id) {
        setErro('')
        const { error } = await supabase.from('food_logs').delete().eq('id', id)
        if (error) {
            setErro(`Não foi possível remover a refeição: ${error.message}`)
            return
        }
        setRegistros((atuais) => atuais.filter((registro) => registro.id !== id))
    }

    // Totais do dia
    const totais = registros.reduce(
        (t, r) => ({
            kcal: t.kcal + Number(r.kcal),
            proteina: t.proteina + Number(r.protein_g),
            carboidrato: t.carboidrato + Number(r.carbs_g),
            gordura: t.gordura + Number(r.fat_g)
        }),

        {
            kcal: 0,
            proteina: 0,
            carboidrato: 0,
            gordura: 0,
        }
    )

    // Prévia dos valores enquanto digita os gramas
    const g = parseFloat(gramas) || 0


    return (
        <div className="row justify-content-center">
            <div className="col-lg-8">
                <h2 className="mb-4">
                    Alimentação
                </h2>

                {erro && <div className="alert alert-danger">{erro}</div>}

                {/* Registrado hoje */}
                <div className="card shadow-sm mb-4">
                    <div className="card-body">
                        <h5 className="mb-3">
                            Registrado hoje
                        </h5>

                        <div className="row text-center g-2 mb-3">
                            <div className="col-3">
                                <div className="fs-5 fw-bold">
                                    {formatar(totais.kcal)}
                                </div>
                                <div className="small text-muted">
                                    kcal
                                </div>
                            </div>

                            <div className="col-3">
                                <div className="fs-5 fw-bold">
                                    {formatar(totais.proteina)} g
                                </div>
                                <div className="small text-muted">
                                    Proteína
                                </div>
                            </div>

                            <div className="col-3">
                                <div className="fs-5 fw-bold">
                                    {formatar(totais.carboidrato)} g
                                </div>
                                <div className="small text-muted">
                                    carboidrato
                                </div>
                            </div>

                            <div className="col-3">
                                <div className="fs-5 fw-bold">
                                    {formatar(totais.gordura)} g
                                </div>
                                <div className="small text-muted">
                                    gordura
                                </div>
                            </div>
                        </div>

                        {carregandoRegistros ? (
                            <p className="text-muted mb-0">Carregando refeições...</p>
                        ) : registros.length === 0 ? (
                            <p className="text-muted mb-0">Nenhum alimento registrado hoje.</p>
                        ) : (

                            <ul className="list-group list-group-flush">
                                {registros.map((r) => (
                                    <li
                                        key={r.id}
                                        className="list-group-item d-flex justify-content-between align-items-start"
                                    >
                                        <div>
                                            <div className="fw-bold">
                                                {r.food_name}
                                            </div>

                                            <div className="small text-muted">
                                                <span className="bagde text-bg-secondary mr-1">
                                                    {REFEICOES.find((X) => X.valor === r.meal_type)?.nome}
                                                </span>
                                                {formatar(Number(r.grams))} g . {formatar(Number(r.kcal))} kcal . P {formatar(Number(r.protein_g))} . C{''}

                                                {formatar(Number(r.carbs_g))} . G {formatar(Number(r.fat_g))}
                                            </div>
                                        </div>

                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => remover(r.id)}
                                        >
                                            Remover
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Formulário do alimento escolhido */}
                {selecionado && (
                    <div className="card border-primary shadow-sm mb-4">
                        <div className="card-body">
                            <h5>{selecionado.nome}</h5>
                            {selecionado.marca && (
                                <div className="text-muted small mb-3">
                                    {selecionado.marca}
                                </div>
                            )}

                            <form onSubmit={salvar}>
                                <div className="row g-2 mb-3">
                                    <div className="col-sm-6">
                                        <label className="form-label">
                                            Quantidade (g)
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={gramas}
                                            onChange={(e) => setGramas(e.target.value)}
                                            min="1"
                                            step="any"
                                            required
                                        />
                                    </div>

                                    <div className="col-sm-6">
                                        <label className="form-label">
                                            Refeição
                                        </label>

                                        <select
                                            className="form-select"
                                            value={refeicao}
                                            onChange={(e) => setRefeicao(e.target.value)}
                                        >
                                            {REFEICOES.map((r) => (
                                                <option 
                                                    key={r.valor}
                                                    value={r.valor}
                                                >
                                                    {r.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="row text-center g-2 mb-3">
                                    <div className="col-3">
                                        <div className="fw-bold">
                                            {formatar(proporcional(selecionado.kcal, g))}
                                        </div>

                                        <div className="small text-muted">kcal</div>
                                    </div>

                                    <div className="col-3">
                                        <div className="fw-bold">
                                            {formatar(proporcional(selecionado.proteina, g))} g
                                        </div>

                                        <div className="small text-muted">proteína</div>
                                    </div>

                                    <div className="col-3">
                                        <div className="fw-bold">
                                            {formatar(proporcional(selecionado.carboidrato, g))} g
                                        </div>

                                        <div className="small text-muted">carboidrato</div>
                                    </div>
                                    
                                    <div className="col-3">
                                        <div className="fw-bold">
                                            {formatar(proporcional(selecionado.gordura, g))} g
                                        </div>

                                        <div className="small text-muted">gordura</div>
                                    </div>
                                </div>


                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-primary"
                                        type="submit"
                                        disabled={salvando}
                                    >
                                        {salvando ? 'Salvando...' : 'Salvar'}
                                    </button>

                                    <button
                                        className="btn btn-outline-seconday"
                                        type="button"
                                        onClick={() => setSelecionado(null)}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Busca */}
                <form className="input-group mb-4" onSubmit={buscar}>
                    <input 
                        type="text"
                        className="form-control"
                        placeholder="Buscar alimento (ex: arroz, leite, biscoito)"
                        value={termo}
                        onChange={(e) => setTermo(e.target.value)}
                    />

                    <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={buscando}
                    >
                        {buscando ? 'Buscando...' : 'Buscar'}
                    </button>
                </form>

                <div>
                    Fonte dos dados: Tabela Brasileira de Composição de Alimentos (TACO), NEPA/UNICAMP.
                </div>

                {buscou && !buscando && resultados.length === 0 && (
                    <p className="text-muted">
                        Nenhum resultado com dados nutricionais.
                    </p>
                )}

                <ul className="list-group mb-5">
                    {resultados.map((a) => (
                       <li
                        key={a.codigo}
                        className="list-group-item"
                       >
                         <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <div className="fw-bold">
                                    {a.nome}
                                </div>
                                {a.marca && <div className="text-muted small">{a.marca}</div>}

                                <div className="small mt-1">
                                    {formatar(a.kcal)} kcal . P {formatar(a.proteina)} g . C{' '}
                                    {formatar(a.carboidrato)} g . G {formatar(a.gordura)} g

                                    <span>(por 100 g)</span>
                                </div>
                            </div>

                            <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => escolher(a)}
                            >
                                Adicionar
                            </button>
                        </div>
                       </li>
                    ))}
                </ul>

            </div>
        </div>
    )
}

export default Alimentacao
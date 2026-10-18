import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../supabaseClient"

const REFEICOES = [
    { valor: 'cafe', nome: 'Café da manhã' },
    { valor: 'almoco', nome: 'Almoço' },
    { valor: 'lanche', nome: 'Lanche da tarde' },
    { valor: 'jantar', nome: 'Jantar' },
]

function formatar(valor) {
    return Math.round(valor * 10) /10
}

function Resumo() {
    const [agua, setAgua] = useState(0)
    const [meta, setMeta] = useState(2000)
    const [refeicoes, setRefeicoes] = useState([])
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState('')

    useEffect(() => {
        async function carregar() {
            const inicio = new Date() 
            inicio.setHours(0, 0, 0, 0)
            const desde = inicio.toISOString()

            // As três consultas rodam ao mesmo tempo
            const [resAgua, resMeta, resComida] = await Promise.all([
                supabase.from('water_logs').select('amount_ml').gte('created_at', desde),
                supabase.from('settings').select('water_goal_ml').maybeSingle(),
                supabase
                    .from('food_logs')
                    .select('*')
                    .gte('created_at', desde)
                    .order('created_at', { ascending: true}),
            ])

            if (resAgua.error || resMeta.error || resComida.error) {
                setErro('Não foi possível carregar o resumo.')
            } else {
                setAgua(resAgua.data.reduce((soma, r) => soma + r.amount_ml, 0))
                if(resMeta.data)
                    setMeta(resMeta.data.water_goal_ml)
                setRefeicoes(resComida.data)
            }
            setCarregando(false)
        }

        carregar()
    }, [])

    if(carregando) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        )
    }

    // Totais de comida do dia
    const totais = refeicoes.reduce(
        (t, r) => ({
            kcal: t.kcal + Number(r.kcal),
            proteina: t.proteina + Number(r.protein_g),
            carboidrato: t.carboidrato + Number(r.carbs_g),
            gordura: t.gordura + Number(r.fat_g),
        }),
        {
            kcal: 0, 
            proteina: 0,
            carboidrato: 0,
            gordura: 0,
        }
    )

    // Quanto cada macro contribui em calorias:
    // 1g de proteina = 4kcal,
    // 1g de carboidrato = 4kcal,
    // 1g de gordura = 9kcal
    const kcalProteina = totais.proteina * 4
    const kcalCarbo = totais.carboidrato * 4
    const kcalGordura = totais.gordura * 9
    const kcalMacros = kcalProteina + kcalCarbo + kcalGordura

    const parte = (kcal) => (kcalMacros > 0 ? (kcal / kcalMacros) * 100 : 0)

    const pctAgua = meta > 0 ? Math.min(100, Math.round((agua / meta) * 100)) : 0
    const metaAtingida = agua >= meta

    const dataHoje = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    })
 


    return (
        <div className="row justify-content-center">
            <div className="col-lg-8">
                <h2 className="mb-1">Resumo do dia</h2>
                <p className="text-muted mb-4">{dataHoje}</p>

                {erro && <div className="alert alert-danger">{erro}</div>}

                <div className="row g-3 mb-3">
                    {/* Água */}
                    <div className="col-md-6">
                        <div className="card shadow-sm h-100">
                            <div className="card-body">
                                <h5 className="card-title">Água</h5>
                                <div className="fs-3 fw-bold">{agua} ml</div>
                                <div className="text-muted mb-2">meta: {meta} ml</div>

                                <div className="progress mb-3" style={{height: '20px'}}>
                                    <div 
                                    className={'progress-bar' + (metaAtingida ? ' bg-success' : '')}
                                    style={{width: pctAgua + '%'}}
                                    >
                                        {pctAgua}%
                                    </div>
                                </div>

                                {metaAtingida && (
                                    <div className="text-success small mb-2">
                                        Meta de hoje Atingida! 🎉
                                    </div>
                                )}

                                <Link to="/agua" className=" btn btn-sm btn-outline-primary">
                                     Registrar água
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Calorias */}
                    <div className="col-md-6">
                        <div className="card shadow-sm h-100">
                            <div className="card-body">
                                <h5 className="card-title">Calorias</h5>
                                <div className="fs-3 fw-bold">
                                    {formatar(totais.kcal)} kcal
                                </div>

                                <div className="text-muted mb-3">
                                    {refeicoes.length} {' '}
                                    {refeicoes.length === 1 ? 'alimento registrado' : 'alimentos registrados'} 
                                </div>
                                <Link to="/alimentacao" className="btn btn-sm btn-outline-primary">
                                    Registrar alimentos
                                </Link>
                            </div>

                        </div>
                    </div>

                     {/* Macronutrientes */}
                     <div className="card shadow-sm mb-3">
                        <div className="card-body">
                            <h5 className="card-title mb-3">
                                Macronutrientes
                            </h5>

                            <div className="row text-center g-2 mb-3">
                                <div className="col-4">
                                    <div className="fs-5 fw-bold">
                                        {formatar(totais.proteina)} g
                                    </div>
                                    <span className="badge text-bg-primary">
                                        Proteínas
                                    </span>
                                    <div>
                                        {Math.round(parte(kcalProteina))}%
                                    </div>
                                </div>

                                <div className="col-4">
                                    <div className="fs-5 fw-bold">
                                        {formatar(totais.carboidrato)} g
                                    </div>
                                    <span className="badge text-bg-warning">Carboidrato</span>

                                    <div className="small text-muted mt-1">
                                        {Math.round(parte(kcalCarbo))}%
                                    </div>
                                </div>

                                <div className="col-4">
                                    <div className="fs-5 fw-bold">
                                        {formatar(totais.gordura)} g
                                    </div>
                                    <span className="badge text-bg-danger">
                                        Gordura
                                    </span>

                                    <div className="small text-muted mt-1">
                                        {Math.round(parte(kcalGordura))}%
                                    </div>
                                </div>
                            </div>

                            {kcalMacros > 0 ? (
                                <div className="progress" style={{height: '20px'}}>
                                    <div
                                        className="progress-bar bg-primary"
                                        style={{width: parte(kcalProteina) + '%'}}
                                    ></div>

                                    <div
                                        className="progress-bar bg-warning"
                                        style={{width: parte(kcalCarbo) + '%'}}
                                    ></div>

                                    <div
                                        className="progress-bar bg-danger"
                                        style={{width: parte(kcalGordura) + '%'}}
                                    ></div>

                                </div>
                            ) : (
                                <p>
                                    Registre alimentos para ver a distribuição de macronutrientes do dia.
                                </p>
                            )}

                            <div className="small text-muted mt-2">
                                Percentual sobre as calorias vindas de proteínas, carboidratos e gorduras.
                            </div>
                        </div>
                     </div>
                    
                    {/* Refeições do dia */}
                    <div className="card shadow-sm mb-5">
                        <div className="card-body">
                            <h5 className="card-title mb-3">Refeições de hoje</h5>

                            {refeicoes.length === 0 ? (
                                <p className="text-muted mb-0">
                                    Nenhum alimento registrado hoje.
                                </p>
                            ) : (
                                REFEICOES.map((ref) => {
                                    const itens = refeicoes.filter((r) => r.meal_type === ref.valor)
                                   
                                    if(itens.length === 0) 
                                        return null

                                    const kcalRef = itens.reduce((s, r) => s + Number(r.kcal), 0)

                                    return (
                                        <div key={ref.valor} className="mb-3">
                                            <div className="d-flex justify-content-between fw-bold">
                                                <span>
                                                    {ref.nome}
                                                </span>

                                                <span>
                                                    {formatar(kcalRef)} kcal
                                                </span>
                                            </div>

                                            <ul className="list-group list-group-flush">
                                                {itens.map((r) => (
                                                    <li 
                                                        key={r.id}
                                                    className="list-group-item d-flex justify-content-between px-0">
                                                        <span>{r.food_name}</span>

                                                        <span>
                                                            {formatar(Number(r.grams))} g . {formatar(Number(r.kcal))} kcal
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Resumo
import { use, useEffect, useState } from "react"
import { supabase } from "../supabaseClient"
import { useAuth } from "../AuthContext"

function Agua() {

    const { user } = useAuth()
    const [registros, setRegistros] = useState([])
    const [meta, setMeta] = useState(2000)
    const [metaInput, setMetaImput] = useState('2000')
    const [outroValor, setOutroValor] = useState('')
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState('')

    async function carregar() {
        // Inicio do dia de hoje, no horário do seu computador
        const inicio = new Date()
        inicio.setHours(0, 0, 0, 0)

        const [resRegistros, resMeta] = await Promise.all([
            supabase
                .from('water_logs')
                .select('id, amount_ml, created_at')
                .gte('created_at', inicio.toISOString())
                .order('created_at', { ascending: false }),
            supabase.from('settings').select('water_goal_ml').maybeSingle(),
        ])

        if (resRegistros.error || resMeta.error) {
            setErro('Não foi possivel carregar seus dados.')
        } else {
            setRegistros(resRegistros.data)
            if (resMeta.data) {
                setMeta(resMeta.data.water_goal_ml)
                setMetaImput(String(resMeta.data.water_goal_ml))
            }
        }
        setCarregando(false)
    }

    useEffect(() => {
        carregar()
    }, [])

    async function adicionar(ml) {
        setErro('')
        const { error } = await supabase.from('water_logs').insert({
            amount_ml: ml
        })
        if (error) {
            setErro('Não foi possível salvar.')
            return
        }
        carregar()
    }

    async function adicionarOutro(e) {
        e.preventDefault()
        const ml = parseInt(outroValor, 10)
        if (!ml || ml <= 0) return
        await adicionar(ml)
        setOutroValor('')
    }

    async function remover(id) {
        setErro('')
        const { error } = await supabase.from('water_logs').delete().eq('id', id)
        if (error) {
            setErro('Não foi possível remover.')
            return
        }
        carregar()
    }

    async function salvarMeta(e) {
        e.preventDefault()
        const novaMeta = parseInt(metaInput, 10)
        if (!novaMeta || novaMeta <= 0) return

        const { error } = await supabase
            .from('settings')
            .upsert({ user_id: user.id, water_goal_ml: novaMeta })

        if (error) {
            setErro('Não foi possível salvar a meta,')
            return
        }
        setMeta(novaMeta)
    }

    const total = registros.reduce((soma, r) => soma + r.amount_ml, 0)
    const porcentagem = Math.min(100, Math.round((total / meta) * 100))
    const metaAtingida = total >= meta

    if (carregando) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        )
    }

    return (
        <div className="row justify-content-center">
            <div className="col-lg-6">
                <h2 className="mb-4">
                    Água de hoje
                </h2>

                {erro && <div className="alert alert-danger">{erro}</div>}

                {/* Progresso */}
                <div className="card shadow-sm mb-4">
                    <div className="card-body">
                        <div className="d-flex justify-content-between mb-2">
                            <span className="fs-4 fw-bold">{total} ml</span>
                            <span className="text-muted align-self-end">meta: {meta} ml</span>
                        </div>

                        <div className="progress" style={{ height: '24px' }}>

                            <div className={'progress-bar' + (metaAtingida ? 'bg-success' : '')}
                                style={{ width: porcentagem + '%' }}>
                                {porcentagem}%
                            </div>
                        </div>

                        {metaAtingida && (
                            <div className="alert alert-success mt-3 mb-0">
                                Meta de hoje atingida! 🎉
                            </div>
                        )}
                    </div>
                </div>

                {/* Botões rápidos */}
                <div className="card shadow-sm mb-4">
                    <div className="card-body">
                        <h5 className="mb-3">
                            Adicionar
                        </h5>

                        <div className="d-flex gap-2 flex-wrap mb-3">
                            {[200, 300, 500, 1000].map((ml) => (
                                <button
                                    key={ml}
                                    className="btn btn-outline-primary"
                                    onClick={() => adicionar(ml)}
                                >
                                    +{ml} ml
                                </button>
                            ))}

                        </div>


                        <form className="input-group" onSubmit={adicionarOutro}>
                            <input
                                type="number"
                                className="form-control"
                                placeholder="Outro valor (ml)"
                                value={outroValor}
                                onChange={(e) => setOutroValor(e.target.value)}
                                min="1"
                            />

                            <button
                                className="btn btn-primary"
                                type="submit"
                            >
                                Adicionar
                            </button>
                        </form>
                    </div>
                </div>

                {/* Meta */}
                <div className="card shadow-sm mb-4">
                    <div className="card-body">
                        <h5 className="mb-3">
                            Minha meta diária
                        </h5>

                        <form className="input-group" onSubmit={salvarMeta}>
                            <input
                                type="number"
                                className="form-control"
                                value={metaInput}
                                onChange={(e) => setMetaImput(e.target.value)}
                                min="1"
                            />

                            <span className="input-group-text">
                                ml
                            </span>

                            <button className="btn btn-secondary" type="submit">
                                Salvar meta
                            </button>
                        </form>
                    </div>
                </div>

                {/* Histórico do dia */}
                <div className="card shadow-sm">
                    <div className="card-body">
                        <h5 className="mb-3">
                            Registros de hoje
                        </h5>
                        {registros.length === 0 ? (
                            <p className="text-muted mb-0">
                                Nehum registro ainda.
                            </p>
                        ) : (
                            <ul className="list-group list-group-flush">
                                {registros.map((r) => (
                                    <li key={r.id}
                                        className="list-group-item d-flex justify-content-between align-items-center">
                                        <span>
                                            {new Date(r.created_at).toLocaleTimeString('pt-BR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}{' '}
                                            - {r.amount_ml} ml
                                        </span>

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

            </div>
        </div>
    )

}

export default Agua
import { useState } from "react"
import { useNavigate, Navigate } from "react-router-dom"
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'

function Login() {
    const [modoCadastro, setModoCadastro] = useState(false)
    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')
    const [mensagem, setMensagem] = useState('')
    const [erro, setErro] = useState('')
    const [enviando, setEnviando] = useState(false)
    const {user, loading } = useAuth()
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()

        setErro('')
        setMensagem('')
        setEnviando(true)

        try {
            if (modoCadastro) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password: senha,
                })

                if (error) {
                    setErro(error.message)
                    return
                }

                if (data?.session) {
                    navigate('/resumo')
                    return
                }

                setMensagem('Conta criada! Confira seu e-mail para confirmar o cadastro.')
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password: senha,
                })

                if (error) {
                    setErro('E-mail ou senha incorretas.')
                    return
                }

                navigate('/resumo')
            }
        } finally {
            setEnviando(false)
        }
    }

    if(!loading && user) {
        return <Navigate to="/resumo" replace />
    }

    return (
        <div className="row justify-content-center">   
            <div className="col-md-6 col-lg-4">
                <div className="card shadow-sm">
                    <div className="card-body p-4">
                        <h3 className="mb-4 text-center">
                            {modoCadastro ? 'Criar conta' : 'Entrar'}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">E-mail</label>

                                <input
                                    type="email"
                                    className="form-control"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Senha</label>
                                <input 
                                    type="password"
                                    className="form-control"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    minLength={6}
                                    required
                                />
                            </div>

                            {erro && <div className="alert alert-danger">{erro}</div>}

                            {mensagem && <div className="alert alert-success">{mensagem}</div>}

                            <button
                                type="submit"
                                className="btn btn-primary w-100"
                                disabled={enviando}
                            >
                                {enviando ? 'Aguarde...' : modoCadastro ? 'Cadastrar' : 'Entrar'}
                            </button>
                        </form>

                        <button
                            className="btn btn-link w-100 mt-3"
                            onClick={() => setModoCadastro(!modoCadastro)}
                        >
                            {modoCadastro ? 'Já tenho conta. Entrar' : 'Não tenho conta. Cadastrar'}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default Login
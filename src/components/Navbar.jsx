import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from '../AuthContext'
import { supabase } from "../supabaseClient";

function Navbar() {
    const linkClass = ({ isActive }) =>
        'nav-link' + (isActive ? ' active fw-bold' : '')

    const { user } = useAuth()
    const navigate = useNavigate()

    async function sair() {
        await supabase.auth.signOut()
        navigate('/login')
    }
 
    return (
        <nav className="navbar navbar-expand-md bg-primary navbar-dark">
            <div className="container">
                <span className="navbar-brand">
                    Projeto Superação
                </span>

                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#menu"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="menu">
                    <ul className="navbar-nav ms-auto">

                        {user && (
                            <>
                                <li className="nav-item">
                                    <NavLink to="/resumo" className={linkClass}>Resumo</NavLink>
                                </li>

                                <li className="nav-item">
                                    <NavLink to="/agua" className={linkClass}>Água</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/alimentacao" className={linkClass}>Alimentação</NavLink>
                                </li>
                            </>
                        )}
                        
                        {user ? (
                                <>

                                    {/*  e-mail e botão sair, como já está*/}
                                    <li className="nav-item">
                                        <span className="nav-link text-white-50">
                                            {user.email}
                                        </span>
                                    </li>
                                    <li className="nav-item">
                                        <button className="btn btn-outline-light btn-sm mt-1" onClick={sair}>
                                            Sair
                                        </button>
                                    </li>
                                </>
                            ) : (
                                <li>
                                    <NavLink to="/login" className={linkClass}>
                                        Login
                                    </NavLink>
                                </li>
                            )
                        }
                    </ul>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
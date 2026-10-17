import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext";

function RotaProtegida() {
    const { user, loading } = useAuth()

    // Ainda verificando se existe sessão salva
    if(loading) {
        return(
            <div className="text-center mt-5">
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        )
    }

    // Com usuário: mostra a página que estava dentro dessa rota
    return user ? <Outlet /> : <Navigate to="/login" replace />

}

export default RotaProtegida
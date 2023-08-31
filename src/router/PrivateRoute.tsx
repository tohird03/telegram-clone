import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "../constants";

type Props = {
  isAuth: boolean
}

export const PrivateRoute = ({isAuth}: Props) => isAuth ? <Outlet /> : <Navigate to={ROUTES.auth}/>

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "../constants";

type Props = {
  isAuth: boolean
}

export const PublicRoute = ({isAuth}: Props) => isAuth ? <Navigate to={ROUTES.home} /> : <Outlet />

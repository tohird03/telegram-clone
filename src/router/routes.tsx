import { observer } from 'mobx-react'
import React, { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Loading } from '../components/Loading'
import { ROUTES } from '../constants'
import { Layout } from '../modules/Layout'
import { Messages } from '../pages/Messages'
import { Auth, Groups, Home, Statistic } from './lazy'
import { PrivateRoute } from './PrivateRoute'
import { PublicRoute } from './PublicRoute'

type Props = {
  isAuth: boolean
}

export const Router = observer(({ isAuth }: Props) => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<PublicRoute isAuth={isAuth} />}>
          <Route index path={ROUTES.auth} element={<Auth />} />
        </Route>
        <Route element={<PrivateRoute isAuth={isAuth} />}>
          <Route path={ROUTES.home} element={
            <Layout>
              <Home />
            </Layout>
          } />
          <Route path={ROUTES.messages} element={
            <Layout>
              <Messages />
            </Layout>
          } />
          <Route path={ROUTES.groups} element={
            <Layout>
              <Groups />
            </Layout>
          } />
          <Route path={ROUTES.statistic} element={
            <Layout>
              <Statistic />
            </Layout>
          } />
        </Route>
      </Routes>
    </Suspense>
  )
})

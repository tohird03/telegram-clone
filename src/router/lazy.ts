import { lazy } from 'react';
import { Loading } from '../components/Loading';


const handleCatchChunkError = () => {
  window.location.reload();

  return {default: Loading};
};

export const Auth = lazy(() =>
  import('../pages/Auth').then(({Auth}) => ({default: Auth})).catch(handleCatchChunkError));

export const Home = lazy(() =>
  import('../pages/Home').then(({Home}) => ({default: Home})).catch(handleCatchChunkError))

export const Messages = lazy(() =>
  import('../pages/Messages').then(({Messages}) => ({default: Messages})).catch(handleCatchChunkError))

export const Groups = lazy(() =>
  import('../pages/Groups').then(({Groups}) => ({default: Groups})).catch(handleCatchChunkError))

export const Statistic = lazy(() =>
  import('../pages/Statistic').then(({Statistic}) => ({default: Statistic})).catch(handleCatchChunkError))

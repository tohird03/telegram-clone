import "react-responsive-carousel/lib/styles/carousel.min.css"; 

import React, { useEffect } from 'react';
import { Router } from '../router';
import './App.css';
import { observer, Provider } from 'mobx-react'
import { stores } from '../store';
import { authStore } from '../store/auth';
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from '../Firebase/firebase';
import { Loading } from '../components/Loading';
import { useBootstrap } from './useBootstrap';

const App = observer(() => {
  const [isInitiated] = useBootstrap();

  useEffect(() => {
    if(!isInitiated || !authStore?.user?.uid) {
      return
    }

    window.addEventListener("beforeunload", function (e) {
      var confirmationMessage = "Chiqishni xohlaysizmi?";
      (e || window.event).returnValue = confirmationMessage;

      setDoc(
        doc(db, "users", authStore?.user?.uid),
        {
          email: 'Tohir',
          lastSeen: serverTimestamp(),
          online: false
        },
        { merge: true }
      );

      return confirmationMessage;
    })

    setDoc(
      doc(db, "users", authStore?.user?.uid),
      {
        email: 'Tohir',
        lastSeen: serverTimestamp(),
        online: true
      },
      { merge: true }
    );
  }, [isInitiated])

  if (isInitiated) {
    return <Loading />;
  }

  return (
    <Provider store={stores}>
      <Router isAuth={authStore.isAuth} />
    </Provider>
  );
})

export default App

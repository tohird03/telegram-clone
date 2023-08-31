import { makeAutoObservable } from "mobx";

class AuthStore {
  isAuth = false
  user: any | null = null
  isOpenLogoutBtn = false

  constructor() {
    makeAutoObservable(this)
  }

  setIsAuth = (isAuth: boolean) => {
    this.isAuth = isAuth
  }

  setLogoutModal = (isOpen: boolean) => {
    this.isOpenLogoutBtn = isOpen
  }

  setUser = (user: any) => {
    this.user = user
  }
}

export const authStore = new AuthStore()

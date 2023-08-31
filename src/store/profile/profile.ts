import { makeAutoObservable } from "mobx";

class ProfileStore {
  isOpenProfileModal = false
  isOpenPartnerProfileModal = false
  partnerId: number | string | null = null
  messagesPartnerId: number | string | undefined = undefined
  uplaodStoryModal = false
  activeMessage: any = null

  constructor() {
    makeAutoObservable(this)
  }

  setOpenProfileModal = (isOpen: boolean) => {
    this.isOpenProfileModal = isOpen
  }

  setOpenPartnerProfileModal = (isOpen: boolean) => {
    this.isOpenPartnerProfileModal = isOpen
  }

  setPartnerId = (id: string | number | null) => {
    this.partnerId = id
  }

  setMessagesPartnerId = (id: string | number | undefined) => {
    this.messagesPartnerId = id
  }

  setUplaodProfile = (isOpen: boolean) => {
    this.uplaodStoryModal = isOpen
  }

  setActiveMessage = (message: any) => {
    this.activeMessage = message
  }
}

export const profileStore = new ProfileStore()

import { Modal } from 'antd'
import { observer } from 'mobx-react'
import React from 'react'
import { authStore } from '../../../store/auth'

export const LogoutModal = observer(() => {

  const handleOk = () => {
    window.localStorage.clear()
    window.location.reload()
  }

  const handleCancel = () => {
    authStore.setLogoutModal(false)
  }

  return (
    <Modal
      title="Chiqishni xohlaysizmi"
      open={authStore.isOpenLogoutBtn}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Ha chiqaman!"
      cancelText="Yo'q chiqishni istamayman!"
    />
  )
})

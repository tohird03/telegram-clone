import { Button, Form, Image, Input, Modal } from 'antd'
import { doc, getDoc } from 'firebase/firestore';
import { observer } from 'mobx-react';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { db } from '../../../Firebase/firebase';
import { profileStore } from '../../../store/profile';

export const PartnerProfileModal = observer(() => {
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const {
    isOpenPartnerProfileModal,
    setOpenPartnerProfileModal,
    partnerId,
  } = profileStore

  const handleModalOk = () => {
    setOpenPartnerProfileModal(false)
  }

  const getData = async (partnerId: string | number) => {
    const partner = doc(db, 'users', String(partnerId))
    const docSnap = await getDoc(partner);
    const profile = docSnap.data()

    form.setFieldsValue({
      firstName: profile?.firstName,
      lastName: profile?.lastName,
      bio: profile?.bio,
      username: profile?.username
    })

    if (profile && profile.photoUrl) {
      setPhotoUrls(profile.photoUrl);
    }
  }

  console.log(partnerId);

  useEffect(() => {
    if (!partnerId) {
      handleModalOk()

      return
    }

    getData(partnerId)
  }, [partnerId])

  const handleSendMessageMyPartner = () => {
    navigate(ROUTES.messages.replace(':chatId', String(partnerId)))
    handleModalOk()
  }

  const renderImages = () => {
    return (
      <Image.PreviewGroup>
        <Image className='profile-img' width={100} height={100} src={String(photoUrls[0])} />
        <div className='other-photo'>
          {photoUrls?.slice(1)?.map((url, index) => (
            <Image key={index} width={100} src={url} className="image-preview" />
          ))}
        </div>
      </Image.PreviewGroup>
    );
  };

  return (
    <Modal
      title="User ma'lumotlari"
      open={isOpenPartnerProfileModal}
      onOk={handleModalOk}
      okText="Yopish"
      className='profile-update__modal'
      onCancel={handleModalOk}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <div className='images-wrapper'>
          {renderImages()}
        </div>

        <Form.Item
          label="Ism"
          name='firstName'
        >
          <Input disabled placeholder='Ismi' />
        </Form.Item>
        <Form.Item
          label="Familiya"
          name='lastName'
        >
          <Input disabled placeholder='Familiyasi' />
        </Form.Item>
        <Form.Item
          label="Bio"
          name='bio'
        >
          <Input disabled maxLength={140} showCount placeholder='Biosi' />
        </Form.Item>
        <Form.Item
          label="Username"
          name='username'
        >
          <Input disabled showCount placeholder='Username' />
        </Form.Item>
        <Button onClick={handleSendMessageMyPartner}>
          Send Message
        </Button>
      </Form>
    </Modal>
  )
})

import { PlusOutlined } from '@ant-design/icons'
import { Form, Image, Input, Modal, notification, Upload, UploadFile, UploadProps } from 'antd'
import { RcFile } from 'antd/es/upload'
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { observer } from 'mobx-react'
import React, { useEffect, useState } from 'react'
import { db, storage } from '../../../Firebase/firebase'
import { authStore } from '../../../store/auth'
import { profileStore } from '../../../store/profile'
import "./profile-update.scss"

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

const uploadButton = (
  <div >
    <PlusOutlined />
    <div style={{ marginTop: 8 }}>Rasm yuklash</div>
  </div>
);

export const ProfileUpdateModal = observer(() => {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [form] = Form.useForm()
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const {
    isOpenProfileModal,
    setOpenProfileModal
  } = profileStore


  const handleCancel = () => {
    setOpenProfileModal(false)
  }

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) =>
    setFileList(newFileList);

  const handleFormFinish = async (values: any) => {
    const { bio, firstName, lastName, username } = form.getFieldsValue()

    if (!firstName || !lastName || !username || !bio) {
      alert('Please fill in all required fields.');
      return;
    }

    if (fileList?.length > 0) {
      const imageRef = ref(storage, `images/${fileList[0]?.name}`);
      await uploadBytes(imageRef, fileList[0].originFileObj as RcFile).then((snapshot) => {
        alert('Uploaded');
        getDownloadURL(snapshot.ref).then(url => {
          setPhotoUrls([url, ...photoUrls]);
        })
      });

      const partner = doc(db, 'users', authStore?.user?.uid)
      const docSnap = await getDoc(partner);

      await getDownloadURL(imageRef)
        .then((url) => {
          setDoc(
            doc(db, "users", authStore?.user?.uid),
            {
              phone: authStore?.user?.phoneNumber,
              lastSeen: serverTimestamp(),
              firstName: firstName,
              lastName: lastName,
              createdAt: serverTimestamp(),
              online: true,
              photoUrl: [
                url,
                ...(docSnap.data()?.photoUrl ? docSnap.data()?.photoUrl.slice(0, 9) : [])
              ],
              id: authStore?.user?.uid,
              username: username,
              bio: bio,
            },
            { merge: true }
          );
        });
    }

    setDoc(
      doc(db, "users", authStore?.user?.uid),
      {
        email: '',
        phone: authStore?.user?.phoneNumber,
        lastSeen: serverTimestamp(),
        firstName: firstName,
        lastName: lastName,
        createdAt: serverTimestamp(),
        online: true,
        id: authStore?.user?.uid,
        username: username,
        bio: bio,
      },
      { merge: true }
    ).then(res => {
      notification.success({
        message: 'Tabriklaymiz!!',
        description: 'Profil ma\'lumotlaringiz muvaffaqiyatli saqlandi',
      });

      updateSenderInfoInMessages();
      updateSenderInfoInGroupMessages();
    })
      .catch(error => {
        notification.error({
          message: 'Error',
          description: 'Xatolik ketdi',
        });
      });
  }

  const updateSenderInfoInMessages = async () => {
    const partner = doc(db, 'users', authStore?.user?.uid);
    const docSnap = await getDoc(partner);

    const messagesRef = collection(db, "messages");
    const senderId = authStore?.user?.uid;
    const querySnapshot = await getDocs(query(messagesRef, where("senderId", "==", senderId)));

    const updatePromises = querySnapshot.docs.map(async (doc) => {
      const messageRef = doc.ref;
      await updateDoc(messageRef, {
        sender: docSnap.data(),
      });
    });

    await Promise.all(updatePromises);
  }

  const updateSenderInfoInGroupMessages = async () => {
    const partner = doc(db, 'users', authStore?.user?.uid);
    const docSnap = await getDoc(partner);

    const messagesRef = collection(db, "groups");
    const senderId = authStore?.user?.uid;
    const querySnapshot = await getDocs(query(messagesRef, where("senderId", "==", senderId)));

    const updatePromises = querySnapshot.docs.map(async (doc) => {
      const messageRef = doc.ref;
      await updateDoc(messageRef, {
        sender: docSnap.data(),
      });
    });

    await Promise.all(updatePromises);
  };

  const getData = async () => {
    try {
      const partner = doc(db, 'users', authStore?.user?.uid)
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
    } catch (error) {
      alert('Sahifani qayta yuklang!!')
    }
  }

  useEffect(() => {
    getData()
  }, [])

  const renderImages = () => {
    if (!photoUrls?.length) {
      return
    }
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
      title="Profil ma'lumotlarini o'zgartirish"
      open={isOpenProfileModal}
      onOk={handleFormFinish}
      onCancel={handleCancel}
      okText="Saqlash"
      cancelText="Bekor qilish"
      className='profile-update__modal'
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={handleFormFinish}
      >
        <div className='images-wrapper'>
          {renderImages()}
          <Upload
            action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
            listType="picture-circle"
            fileList={fileList}
            onPreview={handlePreview}
            onChange={handleChange}
            className='upload__btn'
          >
            {fileList.length > 0 ? null : uploadButton}

          </Upload>
        </div>

        <Form.Item
          label="Ism"
          name='firstName'
          rules={[{ required: true, message: 'Iltimos ismingizni kiriting!' }]}
        >
          <Input placeholder='Iltimos ismingizni kiriting!' />
        </Form.Item>
        <Form.Item
          label="Familiya"
          name='lastName'
          rules={[{ required: true, message: 'Iltimos familiya kiriting!' }]}
        >
          <Input placeholder='Iltimos familiya kiriting!' />
        </Form.Item>
        <Form.Item
          label="Bio"
          name='bio'
          rules={[{ required: true, message: 'Iltimos biongizni kiriting!', max: 140 }]}
        >
          <Input maxLength={140} showCount placeholder='Iltimos biongizni kiriting!' />
        </Form.Item>
        <Form.Item
          label="Username"
          name='username'
          rules={[{ required: true, message: 'Iltimos useringizni kiriting!' }]}
        >
          <Input showCount placeholder='Iltimos useringizni kiriting!' />
        </Form.Item>
      </Form>
    </Modal>
  )
})

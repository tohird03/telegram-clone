import React, { useEffect, useRef, useState } from 'react'
import { Avatar, Button, Image, message, Modal, Upload, UploadFile, UploadProps } from 'antd'
import { CheckOutlined, ClockCircleOutlined, FileOutlined, SendOutlined, SmileOutlined, UserOutlined } from '@ant-design/icons'
import './messages.scss'
import { useGetWidth } from '../../utils/getContentWidth';
import { useNavigate, useParams } from 'react-router-dom';
import { db, storage } from '../../Firebase/firebase';
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { makeFullName } from '../../utils/general';
import { authStore } from '../../store/auth';
import { getFullDate } from '../../utils/getDateFormat';
import { profileStore } from '../../store/profile';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { RcFile } from 'antd/es/upload';
import { formatBytes } from '../../utils/getFileSize';
import { observer } from 'mobx-react';

export const Messages = observer(() => {
  const mainRef = useRef<HTMLElement | null>(null);
  const { chatId } = useParams()
  const navigate = useNavigate()
  const [partnerUser, setPartnerUser] = useState<any>(null)
  const [messages, setMessages] = useState<any>(null)
  const [textareaValue, setTextAreaValue] = useState<string>('')
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [isSendFileModal, setIsSendFileModal] = useState(false)
  const [fileTextArea, setFileTextArea] = useState('')
  const [fileUploadLoading, setFileUploadLoading] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isChatWidthBig = useGetWidth(mainRef) < 900

  const getPartnerData = async () => {
    if (!chatId) {
      navigate(-1);
      return;
    }

    const partner = doc(db, 'users', chatId);

    const unsubscribe = onSnapshot(partner, (docSnap) => {
      if (docSnap.exists()) {
        setPartnerUser(docSnap.data());
        scrollContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    });

    return unsubscribe;
  };

  const handleMessageTyping = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const messageText = event.currentTarget.value.trim();
    if (event.keyCode === 13 && messageText?.length !== 0) {
      if (!authStore?.user?.uid || !chatId) {
        return
      }

      const senderUser = doc(db, 'users', authStore?.user?.uid)
      const senderUserDoc = await getDoc(senderUser);

      const participants = [authStore?.user?.uid, chatId].sort()

      const messageData = {
        text: messageText,
        participants,
        sender: senderUserDoc.data(),
        senderId: authStore?.user?.uid,
        timestamp: serverTimestamp(),
        isRead: false,
      };

      await addDoc(collection(db, "messages"), messageData);
      setTextAreaValue('')
      if (mainRef.current) {
        const messageListContainer = mainRef.current;
        messageListContainer.scrollTop = messageListContainer.scrollHeight;
      }
    }
  }

  const getMessagesData = async (id: string) => {
    if (id !== chatId) {
      return
    }
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', authStore?.user?.uid),
      orderBy('timestamp')
    );

    if (mainRef.current) {
      const messageListContainer = mainRef.current;
      messageListContainer.scrollTop = messageListContainer.scrollHeight;
    }

    onSnapshot(q, (snapshot) => {
      const updatedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }));

      const filterRealMessage = updatedMessages.filter((message: any) => message?.data?.participants.includes(
        profileStore.messagesPartnerId
      ))

      setMessages(filterRealMessage);

      if (mainRef.current) {
        const messageListContainer = mainRef.current;
        messageListContainer.scrollTop = messageListContainer.scrollHeight;
      }

      const partnerMessages = filterRealMessage?.filter(message => message?.data?.senderId === profileStore.messagesPartnerId)

      partnerMessages.forEach(async (message: any) => {
        if (message?.data?.senderId === profileStore.messagesPartnerId) {
          if (!message.data.isRead) {
            const messageRef = doc(db, 'messages', message.id);

            await updateDoc(messageRef, { isRead: true });
          }
        }
      });
    });
  };

  const handleProfileOpen = () => {
    profileStore.setOpenProfileModal(true)
  }

  const handlePartnerOpenProfile = (id: number | string | null) => {
    profileStore.setPartnerId(id)
    profileStore.setOpenPartnerProfileModal(true)
  }

  const handleChange: UploadProps['onChange'] = async ({ fileList: newFileList }) => {
    if (newFileList[0]?.uid) {
      setFileList([...newFileList])
      setIsSendFileModal(true);
    }
  }

  const handleFileSend = async () => {
    if (fileList[0]?.uid) {
      setFileUploadLoading(true)
      const imageRef = ref(storage, `files/${fileList[0]?.name}`);

      await uploadBytes(imageRef, fileList[0].originFileObj as RcFile)
        .then((snapshot) => {
          message.success('Fayl muvaffaqiyatli yuklandi!!!');
          handleFileSendCancel()
        })
        .finally(() => {
          setFileUploadLoading(false)
        });

      await getDownloadURL(imageRef).then(async (url) => {
        const senderUser = doc(db, 'users', authStore?.user?.uid)
        const senderUserDoc = await getDoc(senderUser);

        const participants = [authStore?.user?.uid, chatId].sort()

        const messageData = {
          file: url,
          type: fileList[0]?.type,
          size: fileList[0]?.size,
          fileName: fileList[0]?.name,
          participants,
          sender: senderUserDoc.data(),
          senderId: authStore?.user?.uid,
          timestamp: serverTimestamp(),
          isRead: false,
          message: fileTextArea,
        };

        await addDoc(collection(db, "messages"), messageData);
        setTextAreaValue('')
        if (mainRef.current) {
          const messageListContainer = mainRef.current;
          messageListContainer.scrollTop = messageListContainer.scrollHeight;
        }
      });
    }
  }

  const handleFileSendCancel = () => {
    setIsSendFileModal(false);
    setFileList([])
    setFileTextArea('')
  }

  const handleDownload = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  const myMessage = (message: any) => {
    return <div className='messages__sender'>
      <Avatar
        size="large"
        onClick={handleProfileOpen}
        className="messages__avatar"
        icon={<UserOutlined />}
        src={
          (
            message?.data?.sender?.photoUrl?.length > 0 &&
            message?.data?.sender?.photoUrl[0]
          ) ? message?.data?.sender?.photoUrl[0] : null
        }
      />

      <div className='messages__sender-msg'>
        {
          message?.data?.file ? (
            message?.data?.type?.split('/')[0] === 'image'
              ? <div>
                <Image
                  width={200}
                  src={message?.data?.file}
                  className="message__image-file"
                />
                <h4 className='messages__sender-desc'>
                  {message?.data?.message}
                </h4>
              </div>
              : <div>
                <div className='message__file'>
                  <Button
                    type='link'
                    onClick={handleDownload.bind(null, message?.data?.file)}
                    icon={<FileOutlined />} />
                  <div>
                    <h3>{message?.data?.fileName}</h3>
                    <p>{formatBytes(message?.data?.size)}</p>
                  </div>
                </div>
                <h4 className='messages__sender-desc'>
                  {message?.data?.message}
                </h4>
              </div>
          ) :
            <h4 className='messages__sender-desc'>
              {message?.data?.text}
            </h4>
        }
        <p className='messages__sender-time'>
          {message?.data?.timestamp
            ? getFullDate(String(message?.data?.timestamp?.toDate()))
            : <span className='check__messages'>
              <ClockCircleOutlined />
            </span>
          }
          {message?.data?.timestamp && (
            message?.data?.isRead
              ? <span className='check__messages'>
                <CheckOutlined /><CheckOutlined />
              </span>
              : <span className='check__messages'>
                <CheckOutlined />
              </span>
          )}
        </p>
      </div>
    </div>
  }

  const partnerMessage = (message: any) => {
    return <div className='messages__capture'>
      <div className={`user-avatar ${partnerUser?.online ? 'online' : 'offline'}`}>
        <Avatar
          size="large"
          className="messages__avatar"
          onClick={handlePartnerOpenProfile.bind(null, message?.data?.senderId)}
          src={
            (
              message?.data?.sender?.photoUrl?.length > 0 &&
              message?.data?.sender?.photoUrl[0]
            ) ? message?.data?.sender?.photoUrl[0] : null
          }
          icon={<UserOutlined />}
        />
        {partnerUser?.online && <div className="online-indicator"></div>}
      </div>

      <div className='messages__capture-msg'>
        {
          message?.data?.file ? (
            message?.data?.type?.split('/')[0] === 'image'
              ? <div>
                <Image
                  width={200}
                  src={message?.data?.file}
                  className="message__image-file"
                />
                <h4 className='messages__sender-desc'>
                  {message?.data?.message}
                </h4>
              </div>
              : <div>
                <div className='message__file'>
                  <Button
                    type='link'
                    onClick={handleDownload.bind(null, message?.data?.file)}
                    icon={<FileOutlined />} />
                  <div>
                    <h3>{message?.data?.fileName}</h3>
                    <p>{formatBytes(message?.data?.size)}</p>
                  </div>
                </div>
                <h4 className='messages__sender-desc'>
                  {message?.data?.message}
                </h4>
              </div>
          ) :
            <h4 className='messages__capture-desc'>
              {message?.data?.text}
            </h4>
        }
        <p className='messages__capture-time'>
          {message?.data?.timestamp
            ? getFullDate(String(message?.data?.timestamp?.toDate()))
            : <ClockCircleOutlined />
          }
        </p>
      </div>
    </div>
  }

  useEffect(() => {
    profileStore.setMessagesPartnerId(chatId)
    getPartnerData();
    getMessagesData(chatId!);
  }, [chatId]);

  useEffect(() => {
    if (mainRef.current) {
      const messageListContainer = mainRef.current;
      messageListContainer.scrollTop = messageListContainer.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      profileStore.setMessagesPartnerId(undefined)
    }
  }, [])

  return (
    <>
      <div className='messages'>
        <header className='messages__header'>
          <div>
            <h3 className='messages__select-user'>
              {partnerUser?.firstName ? makeFullName(partnerUser) : partnerUser?.phone}
            </h3>
            <p className='messages__select-user'>
              {partnerUser?.online ? 'online' : getFullDate(String(partnerUser?.lastSeen?.toDate()))}
            </p>
          </div>
        </header>
        <main
          ref={mainRef}
          className={`messages__main ${isChatWidthBig && 'messages__small-main'}`}
        >
          {
            messages?.map((message: any) => (
              message?.data?.senderId === authStore?.user?.uid
                ? myMessage(message)
                : partnerMessage(message)
            ))
          }
          <div className="bottom__messages" ref={scrollContainerRef} />
        </main>
        <footer className='messages__footer'>
          <div className='messages__input'>
            <Upload
              fileList={fileList}
              onChange={handleChange}
            >
              <Button icon={<FileOutlined />} />
            </Upload>
            <textarea
              rows={1}
              className='messages__textarea'
              placeholder='Xabaringizni yozing...'
              onKeyUp={handleMessageTyping}
              value={textareaValue}
              onChange={(event) => setTextAreaValue(event.target.value)}
            />
          </div>
          <div className='messages__send'>
            <Button icon={<SmileOutlined />} />
            <Button icon={<SendOutlined />} />
          </div>
        </footer>

        <div id="bottom" ref={scrollContainerRef} />
      </div>
      <Modal
        open={isSendFileModal}
        onOk={handleFileSend}
        onCancel={handleFileSendCancel}
        okText="Jo'natish"
        cancelText="Bekor qilish"
        width={350}
        closeIcon={false}
        confirmLoading={fileUploadLoading}
      >
        {
          fileList[0]?.type?.split('/')[0] === 'image'
            ? <div className='modal__send-image'>
              <Image
                width={200}
                height={200}
                src={URL.createObjectURL(fileList[0]?.originFileObj!)}
                className="message__image-send-file"
              />
            </div>
            : <div className='message__file'>
              <Button
                icon={<FileOutlined />}
                type="primary"
              />
              <div>
                <h3>{fileList[0]?.name}</h3>
                <p>{formatBytes(fileList[0]?.size!)}</p>
              </div>
            </div>
        }
        <div className='file__send-input'>
          <textarea
            rows={1}
            className='messages__textarea send__file-textarea'
            placeholder="Qo'shimcha"
            value={fileTextArea}
            onChange={(event) => setFileTextArea(event.target.value)}
          />
        </div>
      </Modal>
    </>
  )
})

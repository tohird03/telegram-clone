import React, { useEffect, useRef, useState } from 'react'
import { Avatar, Button, Image, message, Modal, Upload, UploadFile, UploadProps } from 'antd'
import { CheckOutlined, ClockCircleOutlined, FileOutlined, SendOutlined, SmileOutlined, UserOutlined } from '@ant-design/icons'
import './groups.scss'
import { useGetWidth } from '../../utils/getContentWidth';
import { useNavigate, useParams } from 'react-router-dom';
import { db, storage } from '../../Firebase/firebase';
import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { makeFullName } from '../../utils/general';
import { authStore } from '../../store/auth';
import { getFullDate } from '../../utils/getDateFormat';
import { profileStore } from '../../store/profile';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { RcFile } from 'antd/es/upload';
import { formatBytes } from '../../utils/getFileSize';
import { observer } from 'mobx-react';

export const Groups = observer(() => {
  const mainRef = useRef<HTMLElement | null>(null);
  const [partnerUser, setPartnerUser] = useState<any>(null)
  const [messages, setMessages] = useState<any>(null)
  const [textareaValue, setTextAreaValue] = useState<string>('')
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [isSendFileModal, setIsSendFileModal] = useState(false)
  const [fileTextArea, setFileTextArea] = useState('')
  const [fileUploadLoading, setFileUploadLoading] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);
  const [allUser, setAllUser] = useState<any>(null);

  const handleOpenImageViewer = (evt: any) => {
    evt.stopPropagation()
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isChatWidthBig = useGetWidth(mainRef) < 900

  const sendMessages = async (messageText: string) => {
    if (!authStore?.user?.uid) {
      return
    }

    const senderUser = doc(db, 'users', authStore?.user?.uid)
    const senderUserDoc = await getDoc(senderUser);

    const messageData = {
      text: messageText,
      sender: senderUserDoc.data(),
      senderId: authStore?.user?.uid,
      timestamp: serverTimestamp(),
      isRead: false,
    };

    await addDoc(collection(db, "groups"), messageData);
    setTextAreaValue('')
    if (mainRef.current) {
      const messageListContainer = mainRef.current;
      messageListContainer.scrollTop = messageListContainer.scrollHeight;
    }
  }

  const handleMessageTyping = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const messageText = event.currentTarget.value.trim();
    if (event.keyCode === 13 && messageText?.length !== 0) {
      sendMessages(messageText)
    }
  }

  const handleMessageSendButton = () => {
    if (textareaValue?.length !== 0) {
      sendMessages(textareaValue)
    }
  }

  const getMessagesData = async () => {
    const q = query(
      collection(db, 'groups'),
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

      setMessages(updatedMessages);

      if (mainRef.current) {
        const messageListContainer = mainRef.current;
        messageListContainer.scrollTop = messageListContainer.scrollHeight;
      }

      updatedMessages.forEach(async (message: any) => {
        if (message?.data?.senderId !== authStore?.user?.uid) {
          const messageRef = doc(db, 'groups', message.id);
          const messageData = await getDoc(messageRef);
          const isReaderSet = new Set(messageData.get('isReader') || []);
          isReaderSet.add(authStore?.user?.uid);
          const updatedIsReaderArray = Array.from(isReaderSet);
          await updateDoc(messageRef, { isReader: updatedIsReaderArray });
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

        const messageData = {
          file: url,
          type: fileList[0]?.type,
          size: fileList[0]?.size,
          fileName: fileList[0]?.name,
          sender: senderUserDoc.data(),
          senderId: authStore?.user?.uid,
          timestamp: serverTimestamp(),
          isRead: false,
          message: fileTextArea,
        };

        await addDoc(collection(db, "groups"), messageData);
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

  const handleViewMessage = (evt: any, message: any) => {
    evt.stopPropagation()
    profileStore.setActiveMessage(message)
    setViewOpen(true)
  }

  const myMessage = (message: any) => {
    return <div onClick={(evt: any) => handleViewMessage(evt, message)} className='messages__sender'>
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
                <h4 className='messages__sender-desc'>
                  You:
                </h4>
                <Image
                  width={200}
                  src={message?.data?.file}
                  className="message__image-file"
                  onClick={handleOpenImageViewer}
                />
                <h4 className='messages__sender-desc'>
                  {message?.data?.message}
                </h4>
              </div>
              : <div>
                <h4 className='messages__sender-desc'>
                  You:
                </h4>
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
            <>
              <h4 className='messages__sender-desc'>
                You:
              </h4>
              <h4 className='messages__sender-desc'>
                {message?.data?.text}
              </h4>
            </>
        }
        <p className='messages__sender-time'>
          {message?.data?.timestamp
            ? getFullDate(String(message?.data?.timestamp?.toDate()))
            : <span className='check__messages'>
              <ClockCircleOutlined />
            </span>
          }
          {
            message?.data?.isReader?.length > 0
              ? <span className='check__messages'>
                <CheckOutlined /><CheckOutlined />
              </span>
              : <span className='check__messages'>
                <CheckOutlined />
              </span>
          }
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
                <p>{makeFullName(message?.data?.sender)}</p>
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
                <p>{makeFullName(message?.data?.sender)}</p>
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
          ) : <>
            <p>{makeFullName(message?.data?.sender)}</p>
            <h4 className='messages__capture-desc'>
              {message?.data?.text}
            </h4>
          </>
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
    getMessagesData();
  }, []);

  useEffect(() => {
    if (mainRef.current) {
      const messageListContainer = mainRef.current;
      messageListContainer.scrollTop = messageListContainer.scrollHeight;
    }
  }, [messages]);

  const [usersData, setUsersData] = useState<any>([]);

  const fetchUsersData = async (userIds: any[]) => {
    const userRefs = userIds.map((userId) => doc(db, 'users', userId));

    const userSnapshots = await Promise.all(userRefs.map(getDoc));

    userSnapshots.forEach((snapshot) => {
      if (snapshot.exists()) {
        setUsersData([...usersData, { id: snapshot.id, data: snapshot.data() }]);
      }
    });

  };

  const getViewers = async () => {
    if (profileStore.activeMessage) {
      const messageRef = doc(db, 'groups', profileStore.activeMessage.id);

      onSnapshot(messageRef, (docSnapshot) => {
        const messageData = docSnapshot.data();
        if (messageData) {
          const isReaderSet = new Set(messageData.isReader || []);
          const viewersArray = Array.from(isReaderSet);
          fetchUsersData(viewersArray);
        }
      });
    }
  };

  useEffect(() => {
    getViewers();
  }, [profileStore.activeMessage]);

  const handleCloseView = () => {
    setViewOpen(false)
    setUsersData([])
  }

  console.log(usersData);

  const fetchAllUsers = async () => {
    const usersCollection = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollection);
    const allUsers = querySnapshot.docs.map((doc) => doc.data());
    setAllUser(allUsers)
    return allUsers;
  };

  const countOnlineUsers = (users: any) => {
    const onlineUsers = users.filter((user: any) => user.online === true);
    return onlineUsers.length;
  };

  useEffect(() => {
    fetchAllUsers().then((users) => {
      const onlineCount = countOnlineUsers(users);
      setOnlineUsersCount(onlineCount);
    });
  }, []);

  return (
    <>
      <div className='messages'>
        <header className='messages__header group__header'>
          <div>
            <h3 className='messages__select-user'>
              Ommaviy guruh
            </h3>
            <p className='messages__select-user'>
              {allUser?.length} ta a'zo {onlineUsersCount} kishi tarmoqda
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
            <Button onClick={handleMessageSendButton} icon={<SendOutlined />} />
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

      <Modal
        open={viewOpen}
        onCancel={handleCloseView}
        onOk={handleCloseView}
      >
        {usersData?.length > 0
          ? (
            usersData.map((viewerId: any) => (
              <div key={viewerId}>
                {viewerId?.data?.firstName || 'Loading...'}
              </div>
            ))
          )
          : 'Hech kim ko\'rmagan'
        }
      </Modal>
    </>
  )
})

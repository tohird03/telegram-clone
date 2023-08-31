import React, { ReactNode, useEffect, useRef, useState } from 'react'
import { Avatar, Button, Layout as AntLayout, Menu, MenuProps } from 'antd';
import Sider from 'antd/es/layout/Sider';
import { Content } from 'antd/es/layout/layout';
import './layout.scss'
import Search from 'antd/es/input/Search';
import {
  SettingOutlined,
  PlusCircleOutlined,
  PhoneOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { collection, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../Firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { authStore } from '../../store/auth';
import { observer } from 'mobx-react';
import { LogoutModal } from './LogoutModal';
import { profileStore } from '../../store/profile';
import { ProfileUpdateModal } from './ProfileUpdateModal';
import { PartnerProfileModal } from './PartnerProfileModal';
import { StoryIcon } from './Story/StoryIcon';
import { StoryUplaod } from './Story/StoryUpload';

type Props = {
  children: ReactNode
}

export const Layout = observer(({ children }: Props) => {
  const [users, setUsers] = useState<any>([])
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [resizingSidebar, setResizingSidebar] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [unreadMessageCounts, setUnreadMessageCounts] = useState<{ [key: string]: number }>({});
  const navigate = useNavigate()

  const onSearch = async (value: string) => {
    const q = query(collection(db, "users"));
    const querySnapshot = await getDocs(q);

    const mappedUsers = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
    }));

    const filterUser = mappedUsers.filter(user => user?.data?.phone?.includes(value))
    setUsers(filterUser);
  };

  // CHANGE WIDTH
  const handleMouseDown = () => {
    if (sidebarRef.current) {
      setResizingSidebar(true);
      setIsHovering(true)
      document.body.style.cursor = 'col-resize';
    }
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (resizingSidebar && sidebarRef.current) {
        const mouseX = event.clientX;
        const sidebarRect = sidebarRef.current.getBoundingClientRect();
        const newWidth = mouseX - sidebarRect.left;

        if (newWidth >= 250) {
          setContentWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setResizingSidebar(false);
      setIsHovering(false)
      document.body.style.cursor = 'auto';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingSidebar]);

  const handleMouseUp = () => {
    setIsHovering(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick: MenuProps['onClick'] = ({ key, domEvent }) => {
    domEvent.preventDefault();
    domEvent.stopPropagation();
    if (key == ROUTES.groups) {
      navigate(ROUTES.groups)

      return
    }
    navigate(ROUTES.messages.replace(':chatId', key))
  };

  const getUsers = async () => {
    if (!authStore?.user?.uid) {
      return;
    }

    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', authStore?.user?.uid),
      orderBy('timestamp')
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const participantIds = new Set<string>();

      querySnapshot.docs.forEach(doc => {
        const participants = doc.data().participants;
        participants.forEach((participantId: string) => {
          if (participantId !== authStore?.user?.uid) {
            participantIds.add(participantId);
          }
        });
      });

      if(!participantIds.size) {
        return
      }

      const usersQuery = query(collection(db, 'users'), where('id', 'in', Array.from(participantIds)));


      const usersUnsubscribe = onSnapshot(usersQuery, async (usersSnapshot) => {
        const mappedUsers = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data(),
          notReadCount: 0,
          lastMessageTimestamp: 0,
        }));

        const unreadCounts: any = {};

        for (const user of mappedUsers) {
          const userMessagesQuery = query(
            collection(db, 'messages'),
            where('participants', 'array-contains', user.id),
            where('isRead', '==', false),
            orderBy('timestamp', 'desc'),
          );


          const userMessagesSnapshot = await getDocs(userMessagesQuery);

          const userUnreadMessageCount = userMessagesSnapshot.docs.reduce(
            (count, messageDoc) => {
              const messageData = messageDoc.data();

              const isUserParticipant = messageData.senderId === user.id;

              if (isUserParticipant) {
                return count + 1;
              }
              return count;
            },
            0
          );
          unreadCounts[user.id] = userUnreadMessageCount;

          if (!userMessagesSnapshot.empty) {
            const lastMessageData = userMessagesSnapshot.docs[0].data();
            user.lastMessageTimestamp = lastMessageData.timestamp;
          }
        }
        setUnreadMessageCounts(unreadCounts);


        for (const user of mappedUsers) {
          const userMessagesQuery = query(
            collection(db, 'messages'),
            where('participants', 'array-contains', user.id),
            orderBy('timestamp', 'desc'),
          );

          const userMessagesSnapshot = await getDocs(userMessagesQuery);

          if (!userMessagesSnapshot.empty) {
            const lastMessageData = userMessagesSnapshot.docs[0].data();
            user.lastMessageTimestamp = lastMessageData.timestamp;
          }
        }
        mappedUsers.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
        mappedUsers.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
        setUsers(mappedUsers);
      });

      return usersUnsubscribe;
    });

    return unsubscribe;
  };

  useEffect(() => {
    getUsers();
  }, []);

  const handleLogout = () => {
    authStore.setLogoutModal(true)
  }

  const handleOpenProfileUpdate = () => {
    profileStore.setOpenProfileModal(true)
  }

  const handleUplaodStory = () => {
    profileStore.setUplaodProfile(true)
  }

  const handleStatistic = () => {
    navigate(ROUTES.statistic)
  }

  return (
    <AntLayout className='layout'>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        className='layout__sidebar'
        width={contentWidth}
        ref={sidebarRef}
      >
        <div
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className={`layout__sidebar-scroll ${isHovering ? 'sidebar-hovered' : ''}`}
        >

        </div>
        <div className='layout__sidebar-children'>
          <div className='layout__search-wrapper'>
            <Search
              placeholder="input search text"
              onSearch={onSearch}
              className="layout__search"
            />
          </div>
          <StoryIcon />
          <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={['4']}
            onClick={handleClick}
            items={[
              {
                key: ROUTES.groups,
                label: 'Super Guruh',
                icon: <div className='messages__capture layout__capture'>
                  <Avatar
                    className="groups__avatar"
                    icon={<TeamOutlined />}
                  />
                </div>
              },
              ...(users?.length > 0
                ? users.map((user: any, index: number) => ({
                  key: user?.id,
                  label: user?.data?.phone,
                  icon: <div className='messages__capture layout__capture'>
                    <div
                      className={`user-avatar ${user?.data?.online ? 'online' : 'offline'}`}>

                      <Avatar
                        className="layout__avatar"
                        src={(user?.data?.photoUrl?.length > 0 && user?.data?.photoUrl[0])
                          ? user?.data?.photoUrl[0] : null}
                        icon={<UserOutlined />}
                      />
                      {user?.data?.online && <div className="online-indicator"></div>}
                    </div>
                    {
                      unreadMessageCounts[user.id as string] !== 0 ?
                        <div className='unread__count'>{unreadMessageCounts[user.id as string]}</div> : null
                    }
                  </div>
                })) : []
              )
            ]}
            className='layout__menu'
          />
          <div className='layout__bottom-menu'>
            <Button
              type="primary"
              icon={<SettingOutlined />}
              size="large"
              onClick={handleOpenProfileUpdate}
            />
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              size="large"
              onClick={handleUplaodStory}
            />
            <Button type="primary" icon={<PhoneOutlined />} size="large" />
            <Button
              type="primary"
              icon={<BarChartOutlined />}
              size="large"
              onClick={handleStatistic}
            />
            <Button
              type="primary"
              icon={<LogoutOutlined />}
              size="large"
              onClick={handleLogout}
            />
          </div>
        </div>
      </Sider>
      <AntLayout className='layout__main-content'>
        <Content className='layout__content'>
          {children}
        </Content>
      </AntLayout>
      {authStore.isOpenLogoutBtn && <LogoutModal />}
      {profileStore.isOpenProfileModal && <ProfileUpdateModal />}
      {profileStore.isOpenPartnerProfileModal && <PartnerProfileModal />}
      {profileStore.uplaodStoryModal && <StoryUplaod />}
    </AntLayout>
  )
})

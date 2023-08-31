import { UserOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { observer } from 'mobx-react';
import React, { useEffect, useState } from 'react'
import { db } from '../../../../Firebase/firebase';
import { authStore } from '../../../../store/auth';
import './story-reels.scss'

type Props = {
  datas: any,
  stop: boolean,
  inter: number
}

export const StoryReels = observer(({ datas, stop, inter }: Props) => {
  const [loadingEl, setLoadingEl] = useState<any>(null)
  const [activeInter, setActiveInter] = useState(0)
  const handleLike = async () => {
    const partnerStory = doc(db, 'story', authStore?.user?.uid);
    const docSnapStory = await getDoc(partnerStory);

    if (docSnapStory.exists()) {
      const existingStoryData = docSnapStory.data();

      const newStoryData = existingStoryData.story.map((el: any) => {
        if (el?.id === datas?.id) {
          if (el?.likes?.includes(authStore?.user?.uid)) {
            return {
              ...el,
              likes: el?.likes?.filter((likeUserId: string) => likeUserId !== authStore?.user?.uid),
            };
          } else {
            return {
              ...el,
              // @ts-ignore
              likes: [...new Set([...el?.likes, authStore?.user?.uid])],
            };
          }
        } else {
          return el;
        }
      });

      await setDoc(partnerStory, { story: newStoryData }, { merge: true });
    }
  };

  useEffect(() => {
    setLoadingEl(null)

    setLoadingEl((
      <div style={{
        width: '88.45%',
        height: '10px',
        backgroundColor: '#ddd',
        borderTopLeftRadius: '5px',
        borderTopRightRadius: '5px',
        overflow: 'hidden',
        marginBottom: '-10px',
        zIndex: '3000',
        position: 'absolute',
      }}
        className="loading-container"
      >
        <div
          style={{
            width: '0',
            height: '100%',
            backgroundColor: '#3498db',
            animation: 'loadingAnimation 7s linear',
            animationFillMode: 'forwards',
            animationPlayState: inter !== activeInter ? 'running' : 'paused',
          }} className="loading-bar"></div>
      </div>
    ))

    setActiveInter(inter)
  }, [inter])

  return (
    <>
      {inter === activeInter && stop && loadingEl}
      <div className="reel__container" style={{ backgroundImage: `url(${datas?.link})` }}>
        <div className="reel__title">
          <div className="reel__back-button">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-arrow-narrow-left" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <line x1="5" y1="12" x2="9" y2="16"></line>
              <line x1="5" y1="12" x2="9" y2="8"></line>
            </svg>
            <p>Reels</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-camera" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2"></path>
            <circle cx="12" cy="13" r="3"></circle>
          </svg>
        </div>
        <div className="reel__content">
          <div className="reel__desc">
            <div className="reel__user">
              <Avatar src={datas?.user?.photoUrl?.slice(-1)[0]} icon={<UserOutlined />} />
              <p className="reel__username">
                {
                  datas?.user?.firstName?.slice(0, 10) || 'Unknown'
                }
              </p>
            </div>
            <p className="reel__audio">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-tallymark-3" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <line x1="8" y1="7" x2="8" y2="17"></line>
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="16" y1="7" x2="16" y2="17"></line>
              </svg>
              {datas?.desc}
            </p>
          </div>
          <div className="reel__options">
            <div className='reel__option'>
              <div>
                <svg onClick={handleLike} xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-heart" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                  <path
                    stroke={datas?.likes?.includes(authStore?.user?.uid) ? 'red' : 'white'}
                    fill={datas?.likes?.includes(authStore?.user?.uid) ? 'red' : 'none'}
                    d="M19.5 13.572l-7.5 7.428l-7.5 -7.428m0 0a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"></path>
                </svg>
                <p className="reel__likes">
                  {datas?.likes?.length}
                </p>
              </div>
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-send" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                  <line stroke="#fff" x1="10" y1="14" x2="21" y2="3"></line>
                  <path stroke="#fff" d="M21 3l-6.5 18a0.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a0.55 .55 0 0 1 0 -1l18 -6.5"></path>
                </svg>
              </div>
            </div>
            <img src="https://i.scdn.co/image/ab67616d0000b2736227bea855e8e32fe0c4e81f" className="reel__audio-cover" />
          </div>
        </div>
      </div>
    </>)
})

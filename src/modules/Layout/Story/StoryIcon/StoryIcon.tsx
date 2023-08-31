/* eslint-disable jsx-a11y/alt-text */
import React, { useEffect, useState } from 'react'
import { collection, doc, getDoc, onSnapshot, query } from 'firebase/firestore';
import { observer } from 'mobx-react'
import { db } from '../../../../Firebase/firebase';
import { authStore } from '../../../../store/auth';
import { Carousel } from 'react-responsive-carousel';
import './story-icon.scss'
import { StoryReels } from '../StoryReels';

export const StoryIcon = observer(() => {
  const [stories, setStories] = useState<any[]>([])
  const [isOpenStory, setIsOpenStory] = useState(false)
  const [allStory, setAllstory] = useState<any[]>([])
  const [autoPlay, setAutoPlay] = useState(true);
  const [inter, setInter] = useState(0)

  useEffect(() => {
    const q = query(
      collection(db, 'story'),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }));

      setStories(updatedMessages);
      setAllstory(updatedMessages);
    });

    return () => unsubscribe();
  }, []);

  const findMyStory = stories?.find((el: any) => el?.id === authStore?.user?.uid)

  const handleOpenStory = (storyId: number) => {
    const findClickStory = stories?.find((el: any) => el?.id === storyId)
    const otherStory = stories.filter((el: any) => el?.id !== storyId)
    setIsOpenStory(true)
    setAllstory([findClickStory, ...otherStory])
    setAutoPlay(true);
  }

  const handleCloseStory = () => {
    setIsOpenStory(false)
    setAllstory([])
  }

  const handleStopSlide = (evt: any) => {
    setAutoPlay(false)
  }
  const handleStartSlide = (evt: any) => {
    setAutoPlay(true)
  }

  useEffect(() => {
    let count: any = null
    allStory?.forEach((el: any) => {
      el?.data?.story?.forEach((item: any) => {
        count++
      })
    })
    if(inter === count && autoPlay) {
      setTimeout(() => {
        handleCloseStory()
      }, 7000)
    }
  }, [inter, autoPlay])

  const handleOpenStorys = (storyId: number) => {
    const findClickStory = stories?.find((el: any) => el?.id === storyId);
    const otherStory = stories.filter((el: any) => el?.id !== storyId);

    const updatedClickStory = {
      ...findClickStory,
      data: {
        ...findClickStory.data,
        story: findClickStory.data.story.map((item: any) =>
          item.id === authStore?.user?.uid
            ? {
                ...item,
                views: [...item.views, authStore?.user?.uid],
              }
            : item
        ),
      },
    };

    setIsOpenStory(true);
    setAllstory([updatedClickStory, ...otherStory]);
    setAutoPlay(true);
  };

  const storyView = async () => {
    if(!inter) {
      return
    }

    const partnerStory = doc(db, 'story', authStore?.user?.uid);
    const docSnapStory = await getDoc(partnerStory);

    const stories: any = []
    allStory?.forEach((el: any) => {
      el?.data?.story?.forEach((item: any) => {
        stories.push(item)
      })
    })
  }

  useEffect(() => {

  }, [inter])

  return (<>
    <div className='story-icon__wrapper'>
      {findMyStory && <div onClick={handleOpenStory.bind(null, findMyStory?.id)}>
        <div className="story-img">
          <img
            width="50"
            height="50"
            src={findMyStory?.data?.story?.slice(-1)[0]?.link}
          />
        </div>
        <p className='story__user'>
          Your story
        </p>
      </div>
      }
      {
        stories?.map((story: any) => {
          if (story?.id !== authStore?.user?.uid) {
            return <div onClick={handleOpenStory.bind(null, story?.id)}>
              <div className="story-img">
                <img
                  width="50"
                  height="50"
                  src={story?.data?.story?.slice(-1)[0]?.link}
                />
              </div>
              <p className='story__user'>
                {
                  story?.data?.story?.slice(-1)[0]?.user?.firstName?.slice(0, 10) || 'Unknown'
                }
              </p>
            </div>
          }
        })
      }
    </div>

    {
      isOpenStory && (
        <div>
          <div onClick={handleCloseStory} className='story__shadow'></div>
          <div
            onMouseDown={handleStopSlide}
            onMouseUp={handleStartSlide}
            className='story__show'
          >
            <Carousel
              dynamicHeight
              interval={7000}
              axis='horizontal'
              autoPlay={autoPlay}
              showStatus={true}
              statusFormatter={(cur: number, total: number) => {
                setInter(cur);
                return `${cur} - ${total}`
              }}
            >
              {
                allStory?.map((el: any) => (
                  el?.data?.story?.map((item: any) => {
                    return <div className='story__item'>
                      <StoryReels
                        stop={autoPlay}
                        datas={item}
                        inter={inter}
                      />
                    </div>
                  })
                )
                )
              }
            </Carousel>
          </div>
        </div>
      )
    }

  </>
  )
})

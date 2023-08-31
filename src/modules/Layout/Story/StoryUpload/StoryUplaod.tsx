import { PlusOutlined } from '@ant-design/icons';
import { Form, Input, message, Modal, Upload, UploadFile, UploadProps } from 'antd'
import { RcFile } from 'antd/es/upload';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { observer } from 'mobx-react'
import React, { useState } from 'react'
import { db, storage } from '../../../../Firebase/firebase';
import { authStore } from '../../../../store/auth';
import { profileStore } from '../../../../store/profile'
import { uuidv4 } from '@firebase/util';

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
    <div style={{ marginTop: 8 }}>Story add</div>
  </div>
);

export const StoryUplaod = observer(() => {
  const { uplaodStoryModal } = profileStore
  const [form] = Form.useForm()
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([])

  const handleModalFinished = async () => {
    const { desc } = form.getFieldsValue()

    if (fileList?.length > 0) {
      const imageRef = ref(storage, `story/${fileList[0]?.name}`);
      await uploadBytes(imageRef, fileList[0].originFileObj as RcFile).then((snapshot) => {
        handleCancel()
      });

      const partner = doc(db, 'users', authStore?.user?.uid)
      const docSnap = await getDoc(partner);

      const partnerStory = doc(db, 'story', authStore?.user?.uid)
      const docSnapStory = await getDoc(partnerStory);

      let newStoryData: any[] = [];

      if (docSnapStory.exists()) {
        const existingStoryData = docSnapStory.data();
        if (Array.isArray(existingStoryData.story)) {
          newStoryData = existingStoryData.story;
        }
      }

      await getDownloadURL(imageRef).then((url) => {
        newStoryData.push({
          link: url,
          desc: desc,
          user: docSnap.data(),
          likes: [],
          id: uuidv4(),
          views: []
        });

        setDoc(
          doc(db, "story", authStore?.user?.uid),
          {
            createdAt: serverTimestamp(),
            story: newStoryData
          },
          { merge: true }
        ).then(() => {
          message.success('Story added successfully');
        });
      })
    }
  }

  const handleCancel = () => {
    profileStore.setUplaodProfile(false)
  }

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) =>
    setFileList(newFileList);


  return (
    <Modal
      open={uplaodStoryModal}
      onOk={handleModalFinished}
      onCancel={handleCancel}
      width={400}
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={handleModalFinished}
      >
        <div className='images-wrapper'>
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
          label="Story description"
          name='desc'
          rules={[{ required: true, message: 'Story description' }]}
        >
          <Input placeholder='Story description' />
        </Form.Item>
      </Form>
    </Modal>
  )
})

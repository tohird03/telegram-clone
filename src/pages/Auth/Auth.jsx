import React, {useState} from 'react'
import { Button, Form, message, Typography } from 'antd';
import './auth.scss';
import { authDictionary } from './dictionary';
import PhoneInput from 'react-phone-input-2'
import OtpInput from 'react18-input-otp';
import 'react-phone-input-2/lib/style.css'
import { otpCheckNumber } from './constants';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, db } from '../../Firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { authStore } from '../../store/auth';
import { observer } from 'mobx-react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

export const Auth = observer(() => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneErr, setPhoneErr] = useState(false)
  const [otpErr, setOtpErr] = useState(false)
  const [isSendSms, setIsSendSms] = useState(false)
  const navigate = useNavigate()

  const handlePhoneChange = (phone) => {
    setPhone(phone);
  }

  const handleSubmitPhone = (evt) => {
    if (evt) {
      evt.preventDefault()
    }

    const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
    });

    signInWithPhoneNumber(auth, `+${phone}`, recaptchaVerifier)
      .then((confirmationResult) => {
        window.confirmationResult = confirmationResult;
        setIsSendSms(true);
      })
      .catch((error) => {
        setPhoneErr(true)
        console.log(error, phone);
        message.open({
          type: 'error',
          content: 'Telefon raqam noto\'g\'ri yoki nimadir noto\'g\'ri ketdi, 3 soniyadan so\'ng sahifa yangilanadi',
        });
        setTimeout(() => {
          window.location.reload()
        }, 3000);
      });
  };

  const handleChangeOtp = (otp) => {
    setOtp(otp)
  }

  const handleOtpSubmit = () => {
    if (otp.length !== otpCheckNumber) {
      setOtpErr(true)
      return
    }

    if (!window.confirmationResult) return;
    window.confirmationResult
      .confirm(otp)
      .then((result) => {
        window.localStorage.setItem("user", JSON.stringify(result.user));
        window.localStorage.setItem("access_token", JSON.stringify(result?.user?.accessToken));
        window.localStorage.setItem("refresh_token", JSON.stringify(result?.user?.stsTokenManager?.refreshToken));
        authStore.setIsAuth(true)
        authStore.setUser(result?.user)
        setDoc(
          doc(db, "users", result?.user?.uid),
          {
            phone: result?.user?.phoneNumber,
            lastSeen: serverTimestamp(),
            online: true,
            id: result?.user?.uid
          },
          { merge: true }
        );
        navigate(ROUTES.home)
      })
      .catch((error) => {
        console.log(error);
      });

    setOtpErr(false)
  }

  return (
    <div className='auth'>
      <div id='recaptcha-container'></div>
      {!isSendSms
        ? <React.Fragment>
          <Typography.Title className='auth__heading'>
            {authDictionary.authHeading}
          </Typography.Title>
          <Typography.Text strong className='auth__desc'>
            {authDictionary.authDesc}
          </Typography.Text>

          <form onSubmit={handleSubmitPhone}>
            <Form.Item>
              <PhoneInput
                country={'uz'}
                value={phone}
                onChange={handlePhoneChange}
                inputProps={{
                  name: 'phone',
                  required: true,
                  autoFocus: true
                }}
              />
            </Form.Item>
            <Button
              type='primary'
              htmlType="submit"
              className='phone__form-button'
              danger={phoneErr}
            >
              {authDictionary.submit}
            </Button>
          </form>
        </React.Fragment>
        : <React.Fragment>
          <Typography.Title className='auth__heading'>
            {phone}
          </Typography.Title>
          <Typography.Text strong className='auth__desc'>
            {authDictionary.sendSmsDesc}
          </Typography.Text>

          <Form onFinish={handleOtpSubmit}>
            <Form.Item>
              <OtpInput
                value={otp}
                onChange={handleChangeOtp}
                numInputs={otpCheckNumber}
                className="auth__otp-input"
              />
            </Form.Item>
            <Button
              type='primary'
              htmlType="submit"
              className='phone__form-button'
              danger={otpErr}
            >
              {authDictionary.registratsiya}
            </Button>
          </Form>
        </React.Fragment>
      }
    </div >
  )
})

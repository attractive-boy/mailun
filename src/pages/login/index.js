import { useState, useEffect } from 'react';
import { View, Image, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { AtButton } from 'taro-ui';
import './index.scss'; // 自定义样式
import { BASE_API_URL } from '../../constants/common';
import { request } from '../../actions/questionnaires';

export default function Login() {
  const [userInfo, setUserInfo] = useState(null); // 用户信息
  const [avatar, setAvatar] = useState(''); // 用户头像
  const [nickname, setNickName] = useState(''); // 用户昵称

  useEffect(() => {
    Taro.setNavigationBarTitle({
      title: '登录',
    });
  }, []);

  // 微信登录
  const handleLogin = async (event) => {
    try {
      const { code } = await Taro.login(); // 获取 code
      
      if (code) {
        // 发送 code 到后端进行处理
        const res = await request('/wxapi/miniprogrameLogin',{
          
          method: 'POST',
          data: { code }
        });
        console.log('res===>'+ JSON.stringify(res));
        if (res.code === 200) {
          Taro.setStorageSync('token', res.data.token);
          // 登录成功，获取用户信息
          const userInfo1 = res.data.user;
          if (!(userInfo1.avatar_url && userInfo1.nickname)) {
            setUserInfo({ userInfo1 });
            setAvatar(userInfo1.avatar_url || event.detail.avatarUrl); 
            setNickName(userInfo1.nickname);
          }else{
            // 注册成功，跳转到主页面
            Taro.navigateTo({ url: `/pages/index/index` })
          }
        } else {
          Taro.showToast({
            title: '登录失败',
            icon: 'none',
          });
        }
      }
    } catch (error) {
      console.error('微信登录失败', error);
      Taro.showToast({
        title: '登录失败',
        icon: 'none',
      });
    }
  };

  // 处理头像选择
  const onChooseAvatar = (e) => {
    const { avatarUrl } = e.detail;
    setAvatar(avatarUrl); // 更新头像为用户选择的头像
  };

  // 提交用户名和用户信息
  const handleSubmit = async () => {
    try {
      
      Taro.createSelectorQuery()
        .select(".info-content__input")
        .fields({
          properties: ["value"],
        })
        .exec(async (res) => {
          const nickname1 = res[0].value;
          console.log('nickname===>'+ nickname1 + 'avatar===>'+ avatar);
          // 处理nickname
          if (nickname1 && avatar) {
            // 头像上传到服务器
            const uploadRes = await Taro.uploadFile({
              url: BASE_API_URL + '/wxapi/uploadAvatar',
              filePath: avatar,
              name: 'avatar',
            });
            if (uploadRes.statusCode !== 200) {
              Taro.showToast({
                title: '头像上传失败',
                icon: 'none',
              });
              return;
            }
            console.log('uploadRes===>'+ uploadRes.data);
            // 提交用户信息和用户名到后端
            const res1 = await request('/wxapi/registerUser',{
              method: 'POST',
              data: { 
                avatarUrl: JSON.parse(uploadRes.data).filePath,
                nickName: nickname1
              }
            });
            if (res1.code === 200) {
              Taro.showToast({
                title: '注册成功',
                icon: 'success',
              });
              // 注册成功，跳转到主页面
              Taro.navigateTo({ url: `/pages/index/index` })
            } else {
              Taro.showToast({
                title: '注册失败',
                icon: 'none',
              });
            }
          } else {
            Taro.showToast({
              title: '请填写昵称并选择头像',
              icon: 'none',
            });
          }
        });
      
    } catch (error) {
      console.error('提交失败', error);
      Taro.showToast({
        title: '提交失败',
        icon: 'none',
      });
    }
  };

  return (
    <View className='login-page'>
      <Image className='bg-image' src='https://images.unsplash.com/photo-1639443444549-a8d7b05b14b1?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxODd8fHxlbnwwfHx8fHw%3D' mode='aspectFill' />

      <View className='content'>
        <View className='title'>欢迎登录脉轮</View>
        <View className='subtitle'></View>

        {!userInfo ? (
          <AtButton
            type='primary'
            className='login-button'
            openType='getUserInfo'
            onGetUserInfo={handleLogin}
          >
            微信授权登录
          </AtButton>
        ) : (
          <View className='user-info-form'>
            <Button
              open-type='chooseAvatar'
              onChooseAvatar={onChooseAvatar}  
              className='info-content__btn'
            >
              <Image src={avatar} className='info-content__avatar' /> 
            </Button>
            <Input
              className='info-content__input'
              placeholder='请输入昵称'
              value={nickname}
              type='nickname'
            />

            <Button className='submit-button' onClick={handleSubmit}>提交</Button>
          </View>
        )}
      </View>
    </View>
  );
}

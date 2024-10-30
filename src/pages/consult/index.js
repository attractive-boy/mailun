// pages/index.tsx
'use client';

import React, { Component } from "react";
import { View, Text, Image } from "@tarojs/components";
import {
  AtButton,
  AtList,
  AtListItem,
  AtInput,
  AtRadio,
  AtCheckbox,
} from "taro-ui";
import Taro from "@tarojs/taro";
import "./index.scss";
import { request } from "../../actions/questionnaires";

class Consult extends Component {
  constructor(props) {
    super(props);
    this.state = {
      consultation: null,
      questions: [],
      loading: true,
      error: null,
      answers: {}, // 用于存储用户输入或选择的答案
      submitting: false, // 是否正在提交
      submitSuccess: null, // 提交结果状态
      validationErrors: {}, // 存储验证错误信息
    };
  }

  async componentDidMount() {
    try {
      const response = await request("/wxapi/consultation/1", {
        method: "GET",
      });
      console.log("Response:", response);
      if (response.code === 200) {
        const { consultation, questions } = response.data;
        this.setState({ consultation, questions, loading: false });
      } else {
        this.setState({ error: response.data.message, loading: false });
      }
    } catch (error) {
      this.setState({ error: "请求失败，请重试", loading: false });
    }
  }

  handleInputChange = (questionId, value) => {
    this.setState((prevState) => ({
      answers: {
        ...prevState.answers,
        [questionId]: value,
      },
      validationErrors: {
        ...prevState.validationErrors,
        [questionId]: undefined, // 清除对应的验证错误
      },
    }));
  };

  handleRadioChange = (questionId, value) => {
    this.setState((prevState) => ({
      answers: {
        ...prevState.answers,
        [questionId]: value,
      },
      validationErrors: {
        ...prevState.validationErrors,
        [questionId]: undefined,
      },
    }));
  };

  handleCheckboxChange = (questionId, value) => {
    this.setState((prevState) => ({
      answers: {
        ...prevState.answers,
        [questionId]: value, // 直接用 value 更新选中的项
      },
      validationErrors: {
        ...prevState.validationErrors,
        [questionId]: undefined,
      },
    }));
  };

  // 提交表单的函数
  handleSubmit = async () => {
    const { questions, answers } = this.state;
    const validationErrors = {};

    // 验证必填项
    questions.forEach((question) => {
      if (question.required && !answers[question.question_id]) {
        validationErrors[question.question_id] = "此项为必填项";
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      this.setState({ validationErrors });
      Taro.showToast({
        title: "请填写所有必填项",
        icon: "none",
      });
      return; // 阻止提交
    }

    this.setState({ submitting: true });
    try {
      const response = await request("/wxapi/submit_consultation", {
        method: "POST",
        data: {
          consultationId: this.state.consultation.consultation_id,
          answers: this.state.answers,
          responseId: Taro.getCurrentInstance().router.params.responseId,
        },
      });

      if (response.code === 200) {
        this.setState({ submitSuccess: true });
        Taro.showToast({
          title: "提交成功！",
          icon: "success",
        });
        Taro.reLaunch({ url: '/pages/index/index' });
      } else {
        this.setState({ submitSuccess: false });
        Taro.showToast({
          title: `提交失败: ${response.message}`,
          icon: "none",
        });
      }
    } catch (error) {
      this.setState({ submitSuccess: false });
      Taro.showToast({
        title: "提交失败，请重试",
        icon: "none",
      });
    } finally {
      this.setState({ submitting: false });
    }
  };

  render() {
    const { consultation, questions, loading, error, submitting, validationErrors } = this.state;

    if (loading) {
      return (
        <View>
          <Text>加载中...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View>
          <Text>{error}</Text>
        </View>
      );
    }

    if (!consultation) {
      return (
        <View>
          <Text>咨询信息加载失败，请重试。</Text>
        </View>
      );
    }

    return (
      <View className='consult'>
        {/* 封面图片 */}
        <Image
          src={consultation.cover_image}
          mode='widthFix'
          style={{ width: "100%", height: "auto" }}
        />
        <Text className='title'>{consultation.title || "标题未加载"}</Text>
        <Text className='subtitle'>
          {consultation.subtitle || "副标题未加载"}
        </Text>

        <AtList>
          {questions.map((question) => (
            <View key={question.question_id}>
              <AtListItem
                title={
                  <View>
                    {question.question_text}
                    {question.required ? <Text style={{ color: 'red' }}> *</Text> : ''}
                  </View>
                }
              />
              {question.type === "input" && (
                <AtInput
                  name={`input-${question.question_id}`}
                  title='回答'
                  type='text'
                  value={this.state.answers[question.question_id] || ""}
                  onChange={(value) =>
                    this.handleInputChange(question.question_id, value)
                  }
                  required={question.required}
                />
              )}
              {question.type === "radio" && (
                <AtRadio
                  options={question.options.map((option) => ({
                    value: option.option_value,
                    label: option.option_label,
                  }))}
                  value={this.state.answers[question.question_id] || ""}
                  onClick={(value) =>
                    this.handleRadioChange(question.question_id, value)
                  }
                />
              )}
              {question.type === "checkbox" && (
                <AtCheckbox
                  options={question.options.map((option) => ({
                    value: option.option_value,
                    label: option.option_label,
                  }))}
                  selectedList={this.state.answers[question.question_id] || []}
                  onChange={(value) =>
                    this.handleCheckboxChange(question.question_id, value)
                  }
                />
              )}
              {/* 显示验证错误信息 */}
              {validationErrors[question.question_id] && (
                <Text style={{ color: 'red', marginLeft: '10px' }}>
                  {validationErrors[question.question_id]}
                </Text>
              )}
            </View>
          ))}
        </AtList>

        <AtButton
          type='primary'
          onClick={this.handleSubmit}
          loading={submitting}
          disabled={submitting}
        >
          {submitting ? "提交中..." : "提交咨询单"}
        </AtButton>
      </View>
    );
  }
}

export default Consult;

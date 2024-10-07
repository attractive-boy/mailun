import React, { Component } from 'react';
import { connect } from 'react-redux';
import Taro, { getCurrentInstance } from '@tarojs/taro';
import { View } from '@tarojs/components';
import { AtProgress, AtButton } from 'taro-ui';
import PRadio from '../../components/radio';
import { answer, complete } from '../../actions/questionnaires';
import './index.scss';

@connect(({ questionnaires }) => ({
  questionnaires: questionnaires.list,
}))
class Questionnaire extends Component {
  state = {
    questionnaireId: '',
    currentIndex: 0,
    answers: {}, // Added state to keep track of all answers
  }

  componentDidMount() {
    const { router } = getCurrentInstance();
    const { questionnaireId } = router.params;
    this.setState({ questionnaireId: parseInt(questionnaireId) });
  }

  getQuestions = () => {
    const { questionnaires } = this.props;
    const { questionnaireId } = this.state;
    const questionnaire = questionnaires.find(item => item.id === questionnaireId) || {};
    return questionnaire.questions || [];
  }

  handleRadioSelect = selectedKey => {
    const { currentIndex, questionnaireId, answers } = this.state;
    const questions = this.getQuestions();
    const question = questions[currentIndex] || {};
    if (question.single) {
      // Update the answers state with the selected answer
      this.setState(prevState => ({
        answers: {
          ...prevState.answers,
          [question.id]: selectedKey,
        }
      }), () => {
        console.log('Selected answer:', selectedKey);
        if (currentIndex === questions.length - 1) {
          // All questions have been answered
          Taro.showLoading();
          this.props.dispatch(complete(questionnaireId, this.state.answers))
            .then((result) => {
              Taro.hideLoading();
              console.log('Result:', result);
              // 将结果序列化为 JSON 字符串并进行编码
              const encodedResults = encodeURIComponent(JSON.stringify(result.results));

              // 使用 redirectTo 方法并传递结果作为查询参数
              Taro.redirectTo({ url: `/pages/result/index?results=${encodedResults}` });
            })
        } else {
          setTimeout(() => this.setState({ currentIndex: currentIndex + 1 }), 200);
        }
      });
    }
  }

  handlePrev = () => {
    const { currentIndex } = this.state;
    if (currentIndex === 0) {
      return;
    }
    this.setState({
      currentIndex: currentIndex - 1,
    });
  }

  handleNext = () => {
    const { currentIndex, questions } = this.state;
    if (currentIndex === questions.length - 1) {
      return;
    }
    this.setState({
      currentIndex: currentIndex + 1,
    });
  }

  render() {
    const { currentIndex } = this.state;
    const questions = this.getQuestions();
    const question = questions[currentIndex] || {};
    const { title, options, single } = question;
    console.log('Question:', question);
    const selectedIds = question.selectedIds || [];
    const radioOptions = (options || []).map(item => ({
      ...item,
      key: item.score,
      index: item.key,
    }));
    const percent = Math.round(currentIndex / questions.length * 100);
    return (
      <View className='page'>
        <View className='doc-body bg'>
          <View className='panel'>
            <View className='panel__content'>
              <AtProgress percent={percent} status='progress' />
            </View>
          </View>
          <View className='panel'>
            <View className='panel__content'>
              <View className='card'>
                <View className='title'>
                  {title}
                </View>
                <View className='question'>
                  <PRadio options={radioOptions} selectedKey={selectedIds[0]} onSelect={this.handleRadioSelect} />
                </View>
              </View>
            </View>
          </View>
          <View className='panel'>
            <View className='panel__content button'>
              {
                currentIndex > 0 && (
                  <AtButton type='primary' onClick={this.handlePrev}>上一题</AtButton>
                )
              }
              {
                !single && (currentIndex < questions.length - 1) && (
                  <AtButton type='primary' onClick={this.handleNext}>下一题</AtButton>
                )
              }
            </View>
          </View>
        </View>
      </View>
    )
  }
}

export default Questionnaire

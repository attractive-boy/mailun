import React, { Component } from 'react';
import { View, Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro'; // 导入 Taro
import F2 from '@antv/f2'; // 引入 F2
import './index.scss';

class Result extends Component {
  constructor(props) {
    super(props);
    this.canvasRefs = {}; // 使用一个对象来保存多个 Canvas 的 refs
    const systemInfo = Taro.getSystemInfoSync();
    const screenWidth = systemInfo.screenWidth; // 获取屏幕宽度
    this.halfScreenWidth = screenWidth / 2; // 计算一半宽度
    this.moduleData = decodeURIComponent(Taro.getCurrentInstance().router.params.results); // 替换为实际参数名
    // 解析 JSON 字符串
    const parsedData = JSON.parse(this.moduleData);

    // 转换为所需格式
    const convertedData = {};

    Object.keys(parsedData).forEach(wheel => {
      convertedData[wheel] = Object.keys(parsedData[wheel]).map(dimension => ({
        dimension: dimension,
        score: parsedData[wheel][dimension]
      }));
  });
    this.moduleData = convertedData;
  }

  componentDidMount() {
    // 确保组件渲染后再初始化图表
    setTimeout(this.initCharts, 0);
  }

  onShareAppMessage() {
    return {
      title: '问卷宝典',
      path: '/pages/result/index',
    };
  }

  initCharts = () => {
    // 遍历 moduleData 为每个模块创建图表
    Object.keys(this.moduleData).forEach((wheelName) => {
      this.initChart(wheelName);
    });
  };

  initChart = (wheelName) => {
    const data = this.moduleData[wheelName].map(({ dimension, score }) => ({
      wheelName,
      dimension,
      score,
    }));
  
    // 获取 Canvas 上下文
    const canvas = this.canvasRefs[wheelName].current;
  
    if (!canvas) {
      console.error(`Canvas element for ${wheelName} not found`);
      return;
    }
  
    // 使用 Taro 提供的 API 获取 Canvas 2D 上下文
    const context = Taro.createCanvasContext(wheelName, this);
  
    const chart = new F2.Chart({
      el: canvas,
      pixelRatio: window.devicePixelRatio,
      context: context, // 传入上下文
    });
  
    // 设置数据源
    chart.source(data, {
      score: {
        tickCount: 5,
      },
    });
  
    chart.tooltip({
      showItemMarker: false,
      onShow: (ev) => {
        const items = ev.items;
        items[0].name = items[0].wheelName + ': ' + items[0].dimension; // 显示维度名称
        items[0].value = '分数: ' + items[0].score;
      },
    });
  
    // 创建柱状图
    chart.interval().position('dimension*score').color('wheelName');
    
     // 设置 X 轴的样式，调整字体大小和颜色
    chart.axis('dimension', {
      label: (text, index, total) => {
        return {
          fontSize: 8,  // 设置字体大小
          fill: '#000',  // 设置字体颜色
          textAlign: 'center'  // 设置文本对齐方式
        };
      }
    });

  
    chart.render();
  };
  
  

  render() {
    // 获取模块数量，并判断是否为奇数
    const wheelNames = Object.keys(this.moduleData);
    const isOdd = wheelNames.length % 2 !== 0;
  
    return (
      <View className='page'>
        <View className='doc-body bg'>
          <View className='chart-wrapper'>
            {wheelNames.map((wheelName, index) => {
              this.canvasRefs[wheelName] = React.createRef(); // 为每个模块创建一个 ref
  
              // 判断是否为最后一个模块且总数为奇数
              const isLastItem = index === wheelNames.length - 1;
              const style = isLastItem && isOdd
                ? { width: this.halfScreenWidth * 2, height: '150px' } // 宽度为两倍
                : { width: this.halfScreenWidth, height: '150px' };
  
              return (
                <View key={wheelName} className='canvas-container'>
                  <Canvas
                    canvasId={wheelName}
                    style={style}
                    ref={this.canvasRefs[wheelName]}
                  />
                </View>
              );
            })}
          </View>
          <view></view>
        </View>
      </View>
    );
  }
  
}

export default Result;

import React, { Component, MutableRefObject, createRef } from 'react';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, Animated, LogBox, Easing, Modal, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Video, ResizeMode } from "expo-av"

LogBox.ignoreAllLogs();

enum MusicType { 
  None,
  Long,
  Short,  
}

enum MusicStateType {
  None,

  // 完全に止まっている
  Stop,

  // 再生途中で止まっている
  Pause,

  // 再生中
  Playing,
}

class Props {

}

class State {
  title: string
  isShowWarningText: boolean
  selectedMusicType: MusicType
  musicStateType: MusicStateType
  animatedValue: Animated.Value
  isShowModal: boolean
  averageSeconds: number
  averageLoopNum: number
  rangeSeconds: number
  rangeLoopNum: number
  exchangeGiftTime: number
  log: string
}

export default class App extends Component<Props, State> {
  private MAIN_IMAGE_RADIUS: number = 400;
  private videoRef: MutableRefObject<any> = createRef();
  private finishVideoRef: MutableRefObject<any> = createRef();

  constructor(props) {
    super(props);

    this.state = {
      title: "Christmas Gift Exchange",
      isShowWarningText: false,
      selectedMusicType: MusicType.None,
      musicStateType: MusicStateType.Stop,
      animatedValue: new Animated.Value(0),
      isShowModal: false,
      averageSeconds: 20,
      averageLoopNum: 7,
      rangeSeconds: 5,
      rangeLoopNum: 3,
      exchangeGiftTime: 7,
      log: "",
    }
  }

  play(){
    this.videoRef.current.playAsync();
    this.setState({ musicStateType: MusicStateType.Playing });
  }

  /** 最初から再生 */
  async replayAsync(musicType: MusicType, trucNum: number = 1){
    let startPositionList = [0, 143000, 270000, 386000, 464000, 574000, 689000, 790000, 915000, 1017000, 1146000, 1229000, 1382000, 1557000, 1647000, 1742000, 1899000]
    let startPosition = startPositionList[trucNum-1]
    musicType == MusicType.Long ? this.videoRef.current.setPositionAsync(startPosition) : this.videoRef.current.setPositionAsync(10000);
    this.setState({ musicStateType: MusicStateType.Playing, selectedMusicType: musicType });

    // アニメーション開始
    let animation = Animated.loop(Animated.timing(this.state.animatedValue, {toValue: 1, duration: 30000, easing: Easing.linear, useNativeDriver: true}))
    animation.start();

    // ランダム停止開始
    let loopNum = musicType == MusicType.Long ? this.getCustomRandomInt(this.state.averageLoopNum, this.state.rangeLoopNum) : this.getCustomRandomInt(3, 2);
    this.addLog(`loopNum: ${loopNum}`);
    for (let i=0; i<loopNum; i++){
      // 再生時間を取得
      let playSeconds = musicType == MusicType.Long ? this.getCustomRandomInt(this.state.averageSeconds, this.state.rangeSeconds) : this.getCustomRandomInt(5, 2);
      this.addLog(`playSeconds: ${playSeconds}`);

      // 音楽を再生
      this.videoRef.current.playAsync();
      this.setState({title: "Walk around."})

      // 停止タイマーセット
      await new Promise(resolve => setTimeout(resolve, playSeconds * 1000))

      // 一時停止
      this.videoRef.current.pauseAsync();
      this.setState({title: "Exchange gifts."})

      // 音楽再生タイマーセット
      await new Promise(resolve => setTimeout(resolve, this.state.exchangeGiftTime * 1000))
    }

    // 終了処理
    // 終了ジングル再生
    this.setState({title: "Finish!"})
    this.finishVideoRef.current.setVolumeAsync(1);
    this.finishVideoRef.current.playAsync();
    await new Promise(resolve => setTimeout(resolve, 5 * 1000))
    this.finishVideoRef.current.stopAsync();

    // アニメーション停止
    animation.stop();
    this.setState({
      title: "Christmas Gift Exchange",
      selectedMusicType: MusicType.None,
      musicStateType: MusicStateType.Stop,
      animatedValue: new Animated.Value(0),
    })
  }

  /** averageを基準にrangeの範囲に存在する整数値の中からランダムに返します */
  getCustomRandomInt(average: number, range: number) {
    let random = this.getRandomInt(range);
    let def = Math.floor(range/2);
    return average + random - def;
  }

  /** 0からmaxまでの整数をランダムに返します */
  getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  pause(){
    this.videoRef.current.pauseAsync();
    this.setState({ musicStateType: MusicStateType.Pause });
  }

  stop(){
    this.videoRef.current.stopAsync();
    this.setState({ musicStateType: MusicStateType.Stop, selectedMusicType: MusicType.None });
  }

  addLog(log: string){
    this.setState({log: this.state.log + log + "\n"})
  }

  renderBtn(musicType: MusicType, isActivated: boolean){
    let iconSize = 20;
    return(
      <TouchableOpacity
        style={[styles.btnContainer, isActivated ? styles.activatedBtnContainer : styles.inactivatedBtnContainer]}
        onPress={() => {
          let isSelected = this.state.selectedMusicType == musicType;
          if(this.state.musicStateType == MusicStateType.Playing && isSelected){
            // 一時停止
            this.pause();
          }else if(this.state.musicStateType == MusicStateType.Pause && isSelected){
            // 再生
            this.play();
          }else{
            // 最初から再生
            this.replayAsync(musicType);
          }
        }}
      >
        <View style={{width:12}}/>
        <Image 
          source={musicType == MusicType.Long ? require("./assets/4.png") : require("./assets/8.png") } 
          style={{
            width:iconSize, 
            height:iconSize,
            tintColor:isActivated ? "white":"rgb(227,1,5)",
          }}
        />
        <View style={{width:12}}/>
        <Text 
          style={{
            color:isActivated ? "white":"rgb(227,1,5)",
            fontWeight:"bold",
          }}
        >
          {musicType == MusicType.Long ? "Long Version" : "Short Version"}
        </Text>
        <View style={{flex:1}}/>
      </TouchableOpacity>
    )
  }

  renderSettingComponent(title: string, value: number, onPressMinus: () => void, onPressPlus: () => void){
    return(
      <View style={{width: "100%", height: 50, alignItems:"center", flexDirection:"row"}}>
        <View style={{width:24}}/>
        <Text style={{color:"#4d5156", fontWeight:"500"}}>{title}</Text>
        <View style={{flex:1}}/>
        {this.renderCircleBtn("-", onPressMinus)}
        <View style={{width:50, height:50, justifyContent:"center", alignItems:"center"}}>
          <Text style={{color:"#4d5156"}}>{value}</Text>
        </View>
        {this.renderCircleBtn("+", onPressPlus)}
        <View style={{width:24}}/>
      </View>
    )
  }

  renderCircleBtn(text: string, onPress: () => void){
    return(
      <TouchableOpacity
        onPress={onPress}
        style={{width:30, height:30, borderRadius:15, borderColor: "#ccc", borderWidth: 1, justifyContent: "center", alignItems:"center"}}
      >
        <Text style={{color:"#999"}}>{text}</Text>
      </TouchableOpacity>
    )
  }

  render(){
    return (
      <SafeAreaView style={{flex:1, backgroundColor: "white", alignItems:"center"}}>
        <View style={{height:100}}/>
        <Text style={{fontSize:26, fontWeight: "bold"}}>{this.state.title}</Text>
        <View style={{height:24}}/>
        <Animated.Image 
          source={require("./assets/main.png")} 
          style={{
            width:this.MAIN_IMAGE_RADIUS,
            height:this.MAIN_IMAGE_RADIUS,
            borderRadius:this.MAIN_IMAGE_RADIUS,
            transform: [{rotate: this.state.animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", "360deg"],
            })}]
          }}
        />
        <View style={{flex:1}}/>
        {this.renderBtn(MusicType.Long, this.state.selectedMusicType == MusicType.Long)}
        <View style={{height:24}}/>
        {this.renderBtn(MusicType.Short, this.state.selectedMusicType == MusicType.Short)}
        <View style={{height:24}}/>
        <View style={{flexDirection:"row", alignItems:"center",justifyContent:"center", height: 80, width:"100%"}}>
          {this.state.musicStateType == MusicStateType.Stop ? 
            <></> :
            <>
              <TouchableOpacity
                style={{width:50,height:50,justifyContent:"center",alignItems:"center"}}
                onPress={() => {
                  // 最初から再生
                  this.replayAsync(this.state.selectedMusicType);
                }}
              >
                <Image 
                  source={require("./assets/restart.png")} 
                  style={{
                    width:20, 
                    height:20,
                    tintColor:"rgb(44,49,56)",
                  }}
                />
              </TouchableOpacity>
              <View style={{width:48}}/>
              <TouchableOpacity
                onPress={() => {
                  if(this.state.musicStateType == MusicStateType.Playing){
                    // 一時停止
                    this.pause();
                  }else{
                    // 再生
                    this.play();
                  }
                }}
              >
                {this.state.musicStateType == MusicStateType.Playing ?
                  <Image 
                    source={require("./assets/pause-btn.png")} 
                    style={{
                      width:50, 
                      height:50,
                      tintColor:"rgb(227,1,5)",
                    }}
                  /> :
                  <Image 
                    source={require("./assets/play-btn.png")} 
                    style={{
                      width:50, 
                      height:50,
                      tintColor:"rgb(227,1,5)",
                    }}
                  />
                }
              </TouchableOpacity>
              <View style={{width:48}}/>
              <TouchableOpacity
                style={{width:50,height:50,justifyContent:"center",alignItems:"center"}}
                onPress={() => {
                  // 停止
                  this.stop();
                }}
              >
                <Image 
                  source={require("./assets/stop.png")} 
                  style={{
                    width:20, 
                    height:20,
                    tintColor:"rgb(44,49,56)",
                  }}
                />
              </TouchableOpacity>
            </>
          }
        </View>
        <View style={{height:24}}/>
        {this.state.musicStateType == MusicStateType.Playing &&
          <TouchableOpacity 
            onPress={async () => {
              this.setState({isShowWarningText: true})
              await new Promise(resolve => setTimeout(resolve, 2 * 1000))
              this.setState({isShowWarningText: false})
            }}
            style={{
              position: 'absolute',
              zIndex: 100,
              top: 0, 
              right: 0,
              width: '100%',
              height: "200%",
              alignItems: "center",
            }}
          >
            <View style={{height:85}}/>
            {this.state.isShowWarningText &&
              <View
                style={{
                  backgroundColor:"rgb(245,239,218)",
                  padding: 12,
                  alignItems:"center",
                  justifyContent:"center",
                  borderRadius: 5,
                  flexDirection: "row",
                }}
              >
                <Image 
                  source={require("./assets/info.png")} 
                  style={{
                    width:20, 
                    height:20,
                    tintColor:"rgb(239,187,0)",
                  }}
                />
                <View style={{width:12}}/>
                <Text style={{color:"rgb(239,187,0)"}}>Cannot touch while music is playing.</Text>
              </View>
            }
          </TouchableOpacity>
        }
        <Video
          ref={this.videoRef}
          source={require("./assets/music.mp3")}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping
        />
        <Video
          ref={this.finishVideoRef}
          source={require("./assets/finish.mp4")}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping={false}
        />
        <TouchableOpacity 
            onPress={() => this.setState({isShowModal: true})}
            style={{
              position: 'absolute',
              zIndex: 100,
              top: 60, 
              left: 12,
              alignItems: "center",
            }}
        >
          <Image
            source={require("./assets/setting.png")} 
            style={{
              width:30, 
              height:30,
              tintColor:"rgb(75,75,75)",
            }}
          />
        </TouchableOpacity>
        <Modal
          transparent={true}
          visible={this.state.isShowModal}
        >
          <TouchableOpacity
            onPress={() => this.setState({isShowModal: false})}
            style={{flex:1, justifyContent: "center", alignItems: "center", backgroundColor:"rgba(0,0,0,0.2)"}}
          >
            <TouchableWithoutFeedback>
              <View style={{width:350, height:500, backgroundColor:"white", borderRadius: 20}}>
                <View style={{height:12}}/>
                {this.renderSettingComponent("Average Time", this.state.averageSeconds,() => this.setState({averageSeconds: this.state.averageSeconds-1}),() => this.setState({averageSeconds: this.state.averageSeconds+1}))}
                {this.renderSettingComponent("Range Time", this.state.rangeSeconds,() => this.setState({rangeSeconds: this.state.rangeSeconds-1}),() => this.setState({rangeSeconds: this.state.rangeSeconds+1}))}
                {this.renderSettingComponent("Average Loop Num", this.state.averageLoopNum,() => this.setState({averageLoopNum: this.state.averageLoopNum-1}),() => this.setState({averageLoopNum: this.state.averageLoopNum+1}))}
                {this.renderSettingComponent("Range Loop Num", this.state.rangeLoopNum,() => this.setState({rangeLoopNum: this.state.rangeLoopNum-1}),() => this.setState({rangeLoopNum: this.state.rangeLoopNum+1}))}
                {this.renderSettingComponent("Exchange Gift Time", this.state.exchangeGiftTime,() => this.setState({exchangeGiftTime: this.state.exchangeGiftTime-1}),() => this.setState({exchangeGiftTime: this.state.exchangeGiftTime+1}))}
                <ScrollView style={{padding:12}}>
                  <Text>{this.state.log}</Text>
                </ScrollView>
                </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  btnContainer: {
    width: "80%",
    height:60,
    backgroundColor:"rgba(227,1,5, 0.1)",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center"
  },
  activatedBtnContainer: {
    backgroundColor:"rgba(227,1,5, 1)",
  },
  inactivatedBtnContainer: {
    backgroundColor: "white",
    borderColor: "rgb(277, 1, 5)",
    borderWidth: 2,
  },
})

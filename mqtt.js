let reconnect
class Mqtt {
  constructor (mqttOptions, onMessageArrived) {
    this.mqttOptions = mqttOptions
    this.onMessageArrived = onMessageArrived
    this.client = null
    this.angle = -5
  }
  connectMqtt () {
    this.client = new Paho.MQTT.Client(this.mqttOptions.host, Number(this.mqttOptions.port), this.mqttOptions.path, this.mqttOptions.clientId)
    this.client.startTrace()
    this.client.onConnectionLost = this.onConnectionLost.bind(this)
    this.client.onMessageArrived = this.onMessageArrived
    this.client.connect(
        {
          onSuccess: this.onConnect.bind(this),
          userName: this.mqttOptions.username,
          password: this.mqttOptions.password,
          useSSL: this.mqttOptions.useSSL,
          onFailure(err) {
            console.log(err)
          }
        })
  }
  onConnect () {
    console.log('Connect Success', this.mqttOptions.subscription)
    clearInterval(reconnect)
    this.mqttOptions.subscription.forEach(item => {
      this.client.subscribe(item, { qos: 0, onSuccess: () => {
          console.log("订阅成功")
          } })
    })
  }
  onConnectionLost (responseObject) {
    if (responseObject.errorCode !== 0) {
      console.log('onConnectionLost:' + responseObject.errorMessage)
      const _this = this
      reconnect = setInterval(() => {
        console.log('reconnect...')
        _this.client.connect(
            {
              onSuccess: _this.onConnect.bind(this),
              userName: _this.mqttOptions.username,
              password: _this.mqttOptions.password,
              useSSL: _this.mqttOptions.useSSL,
              onFailure(err) {
                console.log(err)
              }
            })
      }, 10000)
    }
  }
}

export default Mqtt

class ContextManger {
  constructor(sio) {
    this.context = [];
    // example context: [{ state : 'Piero te dio un golpe', time: mew Date() , hour12: '3:45 pm' }]
    this.sio = sio;
  }

  get() {
    return this.context;
  }

  set(item) {
    this.context.push(item);
  }

  emitContextUpdate() {
    this.orderContextByTime()
    this.sio.emit('context_update', this.context);
  }

  getCurrentTime12(date) {
    let h = date.getHours();
    let m = date.getMinutes();
    const ampm = h >= 12 ? "pm" : "am";

    h = h % 12 || 12;
    m = m.toString().padStart(2, "0");

    return `${h}:${m} ${ampm}`;
  }

  orderContextByTime() {
    this.context.sort((a, b) => b.time - a.time);

    this.context = this.context.map(item => ({
      ...item,
      hour12: this.getCurrentTime12(item.time),
      time: item.time.getTime()
    }));
  }

}

export default ContextManger;
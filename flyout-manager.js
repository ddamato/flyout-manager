class FlyoutManager {
  constructor({ precision } = { precision: .05 }) {
    this._registry = new Map();
    this._precision = precision;
    return new Promise((res) => {
      window.requestAnimationFrame(() => {
        this.connect();
        res(this);
      }); 
    });
  }

  _ioCallback(entries, observer) {
    entries.forEach(function checkEntry(entry) {
      const { boundingClientRect, isIntersecting, target } = entry;
      this._registry.get(target)[isIntersecting ? 'add' : 'delete'](observer);
      this._checkVisible(target, boundingClientRect);
      this._setMovement(target, boundingClientRect);
    }, this);
  }

  _layerVisible(elem, boundingClientRect) {
    const { left, top, width, height } = boundingClientRect;
    const element = document.elementFromPoint(left + (width / 2), top + (height / 2));
    return elem === element || elem.contains(element);
  }

  _checkVisible(elem, boundingClientRect) {
    elem.dispatchEvent(new CustomEvent('targetvisible', { 
      detail: { 
        container: !!this._registry.get(elem).size,
        layer: this._layerVisible(elem, boundingClientRect)
      }
    }));
  }

  _setMovement(elem, rect) {
    elem.dispatchEvent(new CustomEvent('targetmove', { detail: rect.toJSON() }));
  }

  destroy() {
    return new Promise((res) => {
      window.requestAnimationFrame(() => {
        this.disconnect();
        res(this);
      });
    })
  }

  connect() {
    const amount = Math.round(Math.pow(this._precision, -1));
    this._percent = this._precision * 100;
    this._threshold = Array(amount)
      .fill(this._precision)
      .map((p, i) => (p * i).toFixed(2))
      .map(Number);
    this._observers = Array(amount * amount)
      .fill(amount)
      .map(this._createOptions, this)
      .map(this._createObserver, this);
    return this;
  }

  _createObserver(options) {
    return new IntersectionObserver(this._ioCallback.bind(this), options);
  }

  _createOptions(amount, index) {

    const x = Math.floor(index / amount);
    const y = index % amount;
    
    const left = x * this._percent;
    const top = y * this._percent;
    const right = 100 - (left + this._percent);
    const bottom = 100 - (top + this._percent);
    const rootMargin = [top, right, bottom, left].map((m) => `-${m.toFixed(1)}%`).join(' ');

    return {
      rootMargin,
      threshold: this._threshold,
      root: document.documentElement
    }
  }

  observe(elem) {
    const fn = (observer) => observer.observe(elem);
    this._observers.forEach(fn);
    this._registry.set(elem, new Set(this._observers));
    return this;
  }

  unobserve(elem) {
    const fn = (observer) => observer.unobserve(elem);
    this._observers.forEach(fn);
    this._registry.delete(elem);
    return this;
  }

  disconnect() {
    const fn = (observer) => observer.disconnect();
    this._observers.forEach(fn);
    this._observers = [];
    return this;
  }
}
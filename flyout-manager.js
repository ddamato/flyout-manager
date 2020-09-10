class FlyoutManager {
  constructor({ precision } = { precision: .03 }) {
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
      window.requestAnimationFrame(() => {
        this._checkVisible(target, boundingClientRect);
      });
    }, this);
  }

  _checkVisible(elem, boundingClientRect) {
    const visible = !!this._registry.get(elem).size;
    elem.dispatchEvent(new CustomEvent('targetvisible', { 
      detail: { visible }
    }));

    if (visible) {
      this._setMovement(target, boundingClientRect);
    }
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
    const amount = Math.floor(Math.pow(this._precision, -1));
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

    const percent = this._precision * 100;
    const colPosition = index % amount;
    const rowPosition = Math.floor(index / amount);

    const top = colPosition * percent;
    const left = rowPosition * percent;
    const right = 100 - (left + percent);
    const bottom = 100 - (top + percent);
    const rootMargin = [top, right, bottom, left].map((x) => `-${x.toFixed(1)}%`).join(' ');

    return {
      rootMargin,
      threshold: [0],
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
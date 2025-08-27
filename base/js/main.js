'use strict';

class Preview {
  constructor() {
    this.currentFormat = 0;
    this._bindSelectors();
    this._bindEvents();
    this._getData();
    // _loadFormat will be called after links are populated in _appendLinks
  }

  _getData(){
    fetch('./banners/data.json')
      .then(response => response.json())
      .then(data => {
        const result = data.map(item => ({
          name: item.name,
          width: item.width,
          height: item.height,
          language: item.language
        }));
        console.log(result);
        this._appendLinks(result);
      })
      .catch(error => console.error('Error loading JSON:', error));
  }

  _appendLinks(data) {
    const container = document.querySelector('.bannernav');
    container.innerHTML = '';

    // Group by language
    const groups = {};
    data.forEach(item => {
      if (!groups[item.language]) groups[item.language] = [];
      groups[item.language].push(item);
    });

    Object.keys(groups).forEach(lang => {
      const h1 = document.createElement('h1');
      h1.textContent = lang;
      container.appendChild(h1);

      const ul = document.createElement('ul');
      groups[lang].forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `banners/${item.name}/index.html`;
        a.className = 'done';
        a.textContent = item.name;
        a.dataset.width = item.width;
        a.dataset.height = item.height;
        li.appendChild(a);
        ul.appendChild(li);
      });
      container.appendChild(ul);
    });

    // Re-bind selectors and events after links are added
    this._bindSelectors();
    this._bindEvents();
    if (this.links.length > 0) {
      this._loadFormat({target: this.links[0]});
    }
  }

  _bindSelectors() {
    this.links = Array.prototype.slice.call(document.querySelectorAll('a'));
    this.iframe = document.querySelector('iframe');
  }

  _bindEvents() {
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onClick = this._onClick.bind(this);

    document.addEventListener('keydown', this._onKeyDown);

    for (var i = 0; i < this.links.length; i++) {
      if (this.links[i] && this.links[i].href) {
        this.links[i].addEventListener('click', this._onClick);
      }
    }
  }

  _nextFormat(array) {
    return array[this.currentFormat++];
  }

  _prevFormat(array) {
    return array[this.currentFormat--];
  }

  _onKeyDown(e) {
    switch (e.keyCode) {
      // Left
      case 37:
        e.preventDefault();
        this.iframe.src = this._prevFormat(this.links).href;
        if (this.currentFormat === -1) {
          this.currentFormat = this.links.length - 1;
        }
      break;
      // Right
      case 39:
        e.preventDefault();
        this.iframe.src = this._nextFormat(this.links).href;
        if (this.currentFormat === this.links.length) {
          this.currentFormat = 0;
        }
      break;
    }
  }

  _onClick(e) {
    e.preventDefault();
    this._loadFormat(e);
  }

  _loadFormat(e) {
    if (e.target && e.target.href && this.iframe) {
      // Hide iframe and show loading
      gsap.set('.iframe iframe', {autoAlpha: 0});
      gsap.set('.loading', {autoAlpha: 1});

      // Set iframe src and wait for load event
      this.iframe.src = e.target.href;
      this.iframe.onload = () => {
        if (this.iframe.contentWindow && this.iframe.contentWindow.document) {

          this.iframe.style.width = e.target.dataset.width + 'px';
          this.iframe.style.height = e.target.dataset.height + 'px';

          var banner = this.iframe.contentWindow.document.querySelector('#banner');
          if (banner) {
            // gsap.set(banner, {top: 0, right: 0, bottom: 0, left: 0, position: 'absolute', margin: 'auto'});
            gsap.set('.loading', {autoAlpha: 0});
            gsap.to('.iframe iframe', {duration: 1, autoAlpha: 1});
          } else {
            gsap.set('.loading', {autoAlpha: 0});
            gsap.to('.iframe iframe', {duration: 1, autoAlpha: 1});
          }
        }
      };
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  new Preview();
});

'use strict';

class Preview {
  constructor() {
    this.currentFormat = 0;
    this._bindSelectors();
    this._bindEvents();
    this._getData();
    this._callTooltip();
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
      const languageDiv = document.createElement('div');
      languageDiv.className = 'language';
      container.appendChild(languageDiv);
      const h1 = document.createElement('h1');
      h1.textContent = lang;
      languageDiv.appendChild(h1);

      const ul = document.createElement('ul');
      groups[lang].forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `banners/${item.name}/index.html`;
        a.className = 'asset-link';
        a.textContent = item.name;
        a.dataset.width = item.width;
        a.dataset.height = item.height;
        li.appendChild(a);
        ul.appendChild(li);
      });
      languageDiv.appendChild(ul);
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
    this.controls = Array.prototype.slice.call(document.querySelectorAll('.ad__control'));
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

    for (var j = 0; j < this.controls.length; j++) {
      if (this.controls[j]) {
        this.controls[j].addEventListener('click', this._onClick);
      }
    }
  }

  _nextFormat(e) {
    e.preventDefault();
    this.currentFormat++;
    if (this.currentFormat >= this.links.length) {
      this.currentFormat = 0;
    }
    this._loadFormat({ target: this.links[this.currentFormat] });
  }

  _prevFormat(e) {
    e.preventDefault();
    this.currentFormat--;
    if (this.currentFormat < 0) {
      this.currentFormat = this.links.length - 1;
    }
    this._loadFormat({ target: this.links[this.currentFormat] });
  }

  _onKeyDown(e) {
    switch (e.keyCode) {
      // Left
      case 37:
        this._prevFormat(e);
        break;
      // Right
      case 39:
        this._nextFormat(e);
        break;
    }
  }

  _onClick(e) {
    e.preventDefault();
    if (e.target && e.target.classList) {
      if (e.target.classList.contains('ad__control--restart')) {
        this._restartAnimation();
      } else if (e.target.classList.contains('ad__control--pause')) {
        this._pauseAnimation();
      } else if (e.target.classList.contains('ad__control--resume')) {
        this._resumeAnimation();
      } else if (e.target.classList.contains('ad__control--next')) {
        this._nextFormat(e);
      } else if (e.target.classList.contains('ad__control--prev')) {
        this._prevFormat(e);
      } else if (e.target.classList.contains('asset-link')) {
        this._loadFormat(e);
      }
    }
  }

  _restartAnimation() {
    if (this.iframe && this.iframe.src) {
      const src = this.iframe.src;
      this.iframe.src = '';
      this.iframe.src = src;
      const pauseBtn = document.querySelector('.ad__control--pause');
      if (pauseBtn) {
        pauseBtn.style.display = '';
      }
      // Hide resume button
      const resumeBtn = document.querySelector('.ad__control--resume');
      if (resumeBtn) {
        resumeBtn.style.display = 'none';
      }
    }
  }

  _pauseAnimation() {
    if (this.iframe && this.iframe.contentWindow && this.iframe.contentWindow.gsap) {
      const tl = this.iframe.contentWindow.gsap.globalTimeline;
      if (tl) {
        tl.pause();
        // Show resume button again
        const resumeBtn = document.querySelector('.ad__control--resume');
        if (resumeBtn) {
          resumeBtn.style.display = '';
        }
        // Hide pause button
        const pauseBtn = document.querySelector('.ad__control--pause');
        if (pauseBtn) {
          pauseBtn.style.display = 'none';
        }
      }
    }
  }

  _resumeAnimation() {
    if (this.iframe && this.iframe.contentWindow && this.iframe.contentWindow.gsap) {
      const tl = this.iframe.contentWindow.gsap.globalTimeline;
      if (tl) {
        tl.resume();
        // Show pause button again
        const pauseBtn = document.querySelector('.ad__control--pause');
        if (pauseBtn) {
          pauseBtn.style.display = '';
        }
        // Hide resume button
        const resumeBtn = document.querySelector('.ad__control--resume');
        if (resumeBtn) {
          resumeBtn.style.display = 'none';
        }
      }
    }
  }

  _antiCache(url) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}nocache=${new Date().getTime()}`;
  }

  _loadFormat(e) {
    if (e.target && e.target.href && this.iframe) {
      gsap.set('.ad iframe', {autoAlpha: 0});

      // Set iframe src and wait for load event
      this.iframe.src = this._antiCache(e.target.href);
      this.iframe.onload = () => {
        try {
          if (this.iframe.contentWindow && this.iframe.contentWindow.document) {

            this.iframe.style.width = e.target.dataset.width + 'px';
            this.iframe.style.height = e.target.dataset.height + 'px';

            var banner = this.iframe.contentWindow.document.querySelector('#banner');
            if (banner) {
              gsap.to('.ad iframe', {duration: 1, autoAlpha: 1});
            }

            // Show banner size below iframe
            let adFormat = document.querySelector('.ad__format');
            adFormat.textContent = `${e.target.dataset.width} x ${e.target.dataset.height}`;
          } else {
            this._showAdBlockMessage();
          }
        } catch (err) {
          this._showAdBlockMessage();
        }
      };
    }
  }

  _showAdBlockMessage() {
    const container = document.querySelector('.ad');
    container.innerHTML = '<div class="adblock-message"><h1>Ooops...</h1><h2>AdBlocker Detected</h2><p>It seems that an ad blocker is preventing the preview from loading. Please disable your ad blocker for this page to view the banner previews.</p></div>';
    if (this.iframe) {
      this.iframe.style.display = 'none';
    }
  }

  _callTooltip() {
    console.log('call tooltip');
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
      gsap.from(tooltip, {duration: 1, autoAlpha: 0, y: 100, ease: "back.out", delay: 1, onComplete: () => {
        gsap.to(tooltip, {duration: .5, autoAlpha: 0, delay: 5});
      }});
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  new Preview();
});

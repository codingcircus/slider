function getSliderPreviews(acc, item, key) {
  return `${acc}<li class="slider__preview">
    <a href="#" class="slider__preview-link"${key === 0 ? ' data-active' : ''} data-slide="${key}">${key}. Bild</a>
  </li>`;
}

function getSliderControlsInner(slides) {
  return `
  <a href="#" class="slider__arrow-control slider__previous">Vorheriges Bild</a>
  <ul class="slider__previews">
    ${slides.reduce(getSliderPreviews, '')}
  </ul>
  <a href="#" class="slider__arrow-control slider__next">Nächstes Bild</a>
  `;
}

function getSliderControls(slides) {
  const controls = document.createElement('nav');
  controls.classList.add('slider__controls');
  controls.innerHTML = getSliderControlsInner(slides);
  return controls;
}

export default class Slider extends HTMLElement {
  createdCallback() {
    this.slides = Array.from(this.querySelectorAll('.slide'));
    this.slideInner = this.querySelector('.slider__inner');
    this.posX = 0;

    // Remove Slides from View, cause we will only have enough view "slots" to always show the previous, current and next slide
    this.slides.map(slide => slide.parentNode.removeChild(slide));
    this.currentIndex = 0;

    // Create Visible Slides
    this.previousSlide = this._createSlide();
    this.currentSlide = this._createSlide();
    this.nextSlide = this._createSlide();
    this.visibleSlides = [
      this.previousSlide,
      this.currentSlide,
      this.nextSlide,
    ];
    this.visibleSlides.map(slide => this.slideInner.appendChild(slide));

    // Set to current view
    this.setPosX(this.width);

    this.currentOffsetX = this.width;
    this.mouseDelta = 0;
    this.appendChild(getSliderControls(this.slides));
    this._sliderNavClicked = this._sliderNavClicked.bind(this);
    this._sliderClicked = this._sliderClicked.bind(this);
    this._sliderMoved = this._sliderMoved.bind(this);
    this._sliderReleased = this._sliderReleased.bind(this);
    this._update = this._update.bind(this);

    requestAnimationFrame(this._update);
  }

  attachedCallback() {
    this.addEventListener('click', this._sliderNavClicked);
    this.addEventListener('mousedown', this._sliderClicked);
    this.addEventListener('mousemove', this._sliderMoved);
    this.addEventListener('mouseup', this._sliderReleased);
  }

  detachedCallback() {
    console.log('Detached');
  }

  _createSlide() {
    const slide = document.createElement('div');
    slide.classList.add('slide');
    return slide;
  }

  _sliderClicked(ev) {
    let { target } = ev;

    while(target) {
      if (target.classList.contains('slider__preview-link')) {
        return;
      }

      if (target === this) {
        ev.preventDefault();
        
        // Save starting pageX
        this.posX = ev.pageX;

        // Set Dom Indicator
        this.dragging = true;
        return;
      }
      target = target.parentNode;
    }
  }

  // Since the slider inner is always offsetted to the middle, we need to add width
  _getEvPageX(pageX) {
    return pageX + this.width;
  }

  _sliderMoved(ev) {
    // console.log(this.dataset);
    if (this.dragging) {
      this.mouseDelta = this.posX - ev.pageX;
    }
  }

  _sliderReleased(ev) {
    if (this.dragging) {

      if (Math.abs(this.mouseDelta) >= this.dragThreshold) {
        this._deactivatePreviewLink(this._getPreviewLink(this.currentIndex));

        // Update View
        if (this.mouseDelta > 0) {
          this.currentIndex = this.nextIndex;
          this._updateView(this.previousIndex, this.currentIndex, this.nextIndex);
          this._moveSlideInner(this.currentOffsetX + this.mouseDelta - this.width);
          console.log(this.currentOffsetX + this.mouseDelta - this.width);
        } else {
          this.currentIndex = this.previousIndex;
          this._updateView(this.previousIndex, this.currentIndex, this.nextIndex);
          this._moveSlideInner(this.currentOffsetX + this.mouseDelta + this.width);
          console.log(this.currentOffsetX + this.mouseDelta + this.width);
        }

        this._activatePreviewLink(this._getPreviewLink(this.currentIndex));
      }
      
      // Reset Dom Indicator
      this.dragging = false;
      this.mouseDelta = 0;

      window.requestAnimationFrame(() => {
        this._moveToSlide(this.currentIndex);
      });
    }
  }

  _update() {
    if (this.dragging) {
      this._moveSlideInner(this.currentOffsetX + this.mouseDelta);
    }
    requestAnimationFrame(this._update);
  }

  _sliderNavClicked(ev) {
    const { target } = ev;
    if (target.classList.contains('slider__preview-link')) {
      ev.preventDefault();
      ev.stopPropagation();

      const { slide } = target.dataset;
      
      if (this.currentIndex !== slide) {
        this._deactivatePreviewLink(this._getPreviewLink(this.currentIndex));
        this._activatePreviewLink(this._getPreviewLink(slide));
        this.currentIndex = slide;
        this._moveToSlide(this.currentIndex);
      }
    }
  }

  _updateView(previous, current, next) {
    this.previousSlide.innerHTML = this.slides[previous].innerHTML;
    this.currentSlide.innerHTML = this.slides[current].innerHTML;
    this.nextSlide.innerHTML = this.slides[next].innerHTML;
  }

  _getPreviewLink(slide) {
    return this.querySelector(`.slider__preview-link[data-slide="${slide}"]`);
  }

  _deactivatePreviewLink(previewLink) {
    delete previewLink.dataset.active;
  }

  _activatePreviewLink(previewLink) {
    previewLink.dataset.active = '';
  }

  _moveSlideInner(to) {
    this.slideInner.style.transform = `translateX(-${Math.min(this.maxDragWidth, Math.max(0, to))}px)`;
  }

  _moveToSlide(elem) {
    this.posX = elem * this.getBoundingClientRect().width;
    this._moveSlideInner(this.width);
  }

  setPosX(pos) {
    this.dragging = true;
    this.posX = pos;
    
    window.requestAnimationFrame(() => {
      this._updateView(this.previousIndex, this.currentIndex, this.nextIndex);
      this._moveSlideInner(pos);

      window.requestAnimationFrame(() => {
        this.dragging = false;
      })
    })
  }

  get maxDragWidth() {
    return this.width * (this.slides.length - 1);
  }

  get width() {
    return this.getBoundingClientRect().width;
  }

  get previousIndex() {
    if (this.currentIndex === 0) {
      return this.slides.length - 1;
    }

    return this.currentIndex - 1;
  }

  get nextIndex() {
    if (this.currentIndex === this.slides.length - 1) {
      return 0;
    }

    return this.currentIndex + 1;
  }
  
  get dragThreshold() {
    return 250;
  }

  set dragging(value) {
    if (value) {
      this.setAttribute('dragging');
    } else {
      this.removeAttribute('dragging');
    }
  }

  get dragging() {
    return this.getAttribute('dragging');
  }
}

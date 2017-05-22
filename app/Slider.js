function getSliderPreviews(acc, item, key) {
  return `${acc}<li class="slider__preview">
    <a href="#" class="slider__preview-link"${key === 0 ? ' data-active' : ''} data-slide="${key}">${key}. Bild</a>
  </li>`;
}

function getSliderControlsInner(slides) {
  return `
  <a data-direction="previous" href="#" class="slider__arrow-control slider__previous">Vorheriges Bild</a>
  <ul class="slider__previews">
    ${slides.reduce(getSliderPreviews, '')}
  </ul>
  <a data-direction="next" href="#" class="slider__arrow-control slider__next">Nächstes Bild</a>
  `;
}

function createSlide() {
  const slide = document.createElement('div');
  slide.classList.add('slide');
  return slide;
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
    this.preparing = false;

    // Remove Slides from View, cause we will only have enough view "slots" to always show the previous, current and next slide
    this.slides.map(slide => slide.parentNode.removeChild(slide));
    this.currentIndex = 0;

    // Create Visible Slides
    this.visibleSlides = [createSlide(), createSlide(), createSlide()];
    this.visibleSlides.map(slide => this.slideInner.appendChild(slide));
    this._initView();

    this.currentOffsetX = this.width;
    this.mouseDelta = 0;
    this.appendChild(getSliderControls(this.slides));

    // Bind Events to class
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

    // In case Mouse leaves window, while dragging
    document.addEventListener('mouseout', this._sliderReleased);
  }

  detachedCallback() {
    this.removeEventListener('click', this._sliderNavClicked);
    this.removeEventListener('mousedown', this._sliderClicked);
    this.removeEventListener('mousemove', this._sliderMoved);
    this.removeEventListener('mouseup', this._sliderReleased);

    // In case Mouse leaves window, while dragging
    document.removeEventListener('mouseout', this._sliderReleased);
  }

  _createSlide() {
    const slide = document.createElement('div');
    slide.classList.add('slide');
    return slide;
  }

  _sliderClicked(ev) {
    let { target } = ev;

    // Check if Click Target is part of slider
    while(target) {

      console.log(target);

      // Slider Navigation has it's own event Listener
      if (target.classList.contains('slider__preview-link')) {
        return;
      }

      if (target === this) {
        ev.preventDefault();
        
        // Save starting pageX
        this.pageX = ev.pageX;

        // Set Dom Indicator
        this.dragging = true;
        return;
      }
      target = target.parentNode;
    }
  }

  _sliderMoved(ev) {
    if (this.dragging) {
      this.mouseDelta = this.pageX - ev.pageX;
    }
  }

  _sliderReleased(ev) {
    if (this.dragging) {

      // Check if slider was dragged far enough to switch slide
      if (Math.abs(this.mouseDelta) >= this.dragThreshold) {
        this._deactivatePreviewLink(this._getPreviewLink(this.currentIndex));

        // Next or previous Slide
        if (this.mouseDelta > 0) {
          this._updateSliderAfterRelease(this.nextIndex, -this.width);
        } else {
          this._updateSliderAfterRelease(this.previousIndex, this.width);
        }
      } else {

        // Always reset Dragging
        this._resetAfterDrag();
      }
    }
  }

  _updateSliderAfterRelease(newCurrentIndex, offsetView) {
    this.currentIndex = newCurrentIndex;
    window.requestAnimationFrame(() => {
      this._updateView([this.previousIndex, this.currentIndex, this.nextIndex]);
      this.mouseDelta += offsetView;
      this.translateX = this.currentOffsetX + this.mouseDelta;

      this._resetAfterDrag();
    });

    this._activatePreviewLink(this._getPreviewLink(this.currentIndex));
  }

  _resetAfterDrag() {
      window.requestAnimationFrame(() => {
        this.dragging = false;
        this.mouseDelta = 0;
        this._moveToSlide(this.currentIndex);
      });
  }

  _update() {
    if (this.dragging) {
      this.translateX = this.currentOffsetX + this.mouseDelta;
    }
    requestAnimationFrame(this._update);
  }

  _sliderNavClicked(ev) {
    const { target } = ev;

    if (this._targetIsNavElement(target)) {
      ev.preventDefault();
      ev.stopPropagation();

      // Prevent Double Click
      if (this.preparing) {
        return false;
      }

      const slide = this._getSlideFromNavElement(target);
      
      if (this.currentIndex !== slide) {
        this._deactivatePreviewLink(this._getPreviewLink(this.currentIndex));
        this._activatePreviewLink(this._getPreviewLink(slide));

        // Calculated Value
        this.preparing = true;
        if (this.currentIndex > slide) {
          window.requestAnimationFrame(() => {
            this._prepareToMove((this.visibleSlides.length - 1) * this.width, slide, slide, this.currentIndex);
            window.requestAnimationFrame(() => {
              this._cleanupAfterMove(slide);
            });
          });
        } else {
          window.requestAnimationFrame(() => {
            this._prepareToMove(0, this.currentIndex, slide, slide)
            window.requestAnimationFrame(() => {
              this._cleanupAfterMove(slide);
            });
          });
        }
      }
    }
  }

  _targetIsNavElement(target) {
    const validNames = [
      'slider__preview-link',
      'slider__arrow-control',
    ];

    return validNames.reduce((acc, item) => {
      return acc || target.classList.contains(item);
    }, false);
  }

  _getSlideFromNavElement(target) {

    // Slide Previews
    if (typeof target.dataset.slide !== 'undefined') {
      return parseInt(target.dataset.slide, 10);
    }

    // Arrow Nav Buttons
    if (typeof target.dataset.direction !== 'undefined') {
      switch(target.dataset.direction) {
        case 'next': 
          return this.nextIndex;
        case 'previous':
          return this.previousIndex;
        default:
          return 0;
      }
    }

    return 0;
  }

  _prepareToMove(translateX, first, middle, last) {
    this.translateX = translateX;
    this._updateView([first, middle, last]);
  }

  /**
   * 
   * @param {number} newCurrentIndex 
   */
  _cleanupAfterMove(newCurrentIndex) {
    this.preparing = false;
    this.translateX = this.width;
    this.currentIndex = newCurrentIndex;
    this._updateView([this.previousIndex, this.currentIndex, this.nextIndex]);
  }

  /**
   * 
   * Matches the visible Slides with the indexes in the supplied array
   * 
   * @param {array} newSlides indexes of slides, that should be in view
   */
  _updateView(newSlides) {

    this.visibleSlides = this.visibleSlides.map((slide, index) => {
      slide.innerHTML = this.slides[newSlides[index]].innerHTML;
      return slide;
    });
  }

  /**
   * 
   * @param {number} slide 
   */
  _getPreviewLink(slide) {
    return this.querySelector(`.slider__preview-link[data-slide="${slide}"]`);
  }

  _deactivatePreviewLink(previewLink) {
    delete previewLink.dataset.active;
  }

  _activatePreviewLink(previewLink) {
    previewLink.dataset.active = '';
  }

  _moveToSlide(elem) {
    this.pageX = elem * this.getBoundingClientRect().width;
    this.translateX = this.width;
  }

  _initView() {
    this.preparing = true;
    window.requestAnimationFrame(() => {
      this._updateView([this.previousIndex, this.currentIndex, this.nextIndex]);
      this.translateX = this.width;

      window.requestAnimationFrame(() => {
        this.preparing = false;
      });
    });
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

  get dragging() {
    return this.getAttribute('dragging');
  }

  set dragging(value) {
    if (value) {
      this.setAttribute('dragging', value);
    } else {
      this.removeAttribute('dragging');
    }
  }

  get preparing() {
    return this.getAttribute('preparing');
  }

  set preparing(value) {
    if (value) {
      this.setAttribute('preparing', value);
    } else {
      this.removeAttribute('preparing');
    }
  }

  set translateX(to) {
    this.slideInner.style.transform = `translateX(-${Math.min(this.maxDragWidth, Math.max(0, to))}px)`;
  }

  get translateX() {
    const match=/translateX\(([-]?[0-9]+)px\)/;
    const result = this.slideInner.style.transform.match(match);
    if (result.length > 1) {
      // Return first matching group of regex
      return parseInt(result[1], 10);
    }

    return 0;
  }
}

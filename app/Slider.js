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
    this.currentSlide = 0;
    this.dragging = false;
    this.dragPageX = 0;
    this.currentOffsetX = 0;
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

  _sliderClicked(ev) {
    let { target } = ev;

    while(target) {
      if (target.classList.contains('slider__preview-link')) {
        return;
      }

      if (target === this) {
        ev.preventDefault();
        
        // Save starting pageX
        this.dragPageX = ev.pageX;

        this.dragging = true;
        // Set Dom Indicator
        this.dataset.dragging = '';
        return;
      }
      target = target.parentNode;
    }
  }

  _sliderMoved(ev) {
    // console.log(this.dataset);
    if (this.dragging) {
      this.mouseDelta = this.dragPageX - ev.pageX;
    }
  }

  _sliderReleased(ev) {
    if (this.dragging) {
      this.dragging = false;

      // Reset Dom Indicator
      delete this.dataset.dragging;

      if (Math.abs(this.mouseDelta) >= this.width * .4) {
        this._deactivatePreviewLink(this._getPreviewLink(this.currentSlide));
        this.currentSlide = this.mouseDelta > 0 ? Math.min(this.currentSlide + 1, this.slides.length - 1) : Math.max(this.currentSlide - 1, 0);
        this._activatePreviewLink(this._getPreviewLink(this.currentSlide));
      }
      this._moveToSlide(this.currentSlide);
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
      
      if (this.currentSlide !== slide) {
        this._deactivatePreviewLink(this._getPreviewLink(this.currentSlide));
        this._activatePreviewLink(this._getPreviewLink(slide));
        this.currentSlide = slide;
        this._moveToSlide(this.currentSlide);
      }
    }
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
    const sliderInner = document.querySelector('.slider__inner');
    sliderInner.style.transform = `translateX(-${Math.min(this.maxDragWidth, Math.max(0, to))}px)`;
  }

  _moveToSlide(elem) {
    this.currentOffsetX = elem * this.getBoundingClientRect().width;
    this._moveSlideInner(this.currentOffsetX);
  }

  get maxDragWidth() {
    return this.width * (this.slides.length - 1);
  }

  get width() {
    return this.getBoundingClientRect().width;
  }
}

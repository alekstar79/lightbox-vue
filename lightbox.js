class Renderer
{
  static instance

  static init = (options) => Renderer.instance ||= new Renderer(options)

  static valueInRange = ({ minScale, maxScale, scale }) => scale <= maxScale && scale >= minScale

  static hasPositionChanged = ({ pos, prevPos }) => pos !== prevPos

  static getTranslate = ({ minScale, maxScale, scale }) => ({ pos, prevPos, translate }) =>
    Renderer.valueInRange({ minScale, maxScale, scale }) &&
    Renderer.hasPositionChanged({ pos, prevPos })
      ? translate + (pos - prevPos * scale) * (1 - 1 / scale)
      : translate

  static getScale = ({ scale, minScale, maxScale, scaleSensitivity, deltaScale }) => {
    let newScale = scale + (deltaScale / (scaleSensitivity / scale))

    newScale = Math.max(minScale, Math.min(newScale, maxScale))

    return [scale, newScale]
  }

  static getMatrix = ({ scale, translateX, translateY, skewX = 0, skewY = 0 }) =>
    `matrix(${scale}, ${skewX}, ${skewY}, ${scale}, ${translateX}, ${translateY})`

  constructor({ minScale, maxScale, element, scaleSensitivity = 10 })
  {
    this.state = {
      element,
      minScale,
      maxScale,
      scaleSensitivity,
      transformation: {
        translateX: 0,
        translateY: 0,
        originX: 0,
        originY: 0,
        scale: 1
      }
    }
  }

  zoom({ x, y, deltaScale })
  {
    const { left, top } = this.state.element.getBoundingClientRect()
    const { minScale, maxScale, scaleSensitivity } = this.state
    const [ scale, newScale ] = Renderer.getScale({
      scale: this.state.transformation.scale,
      scaleSensitivity,
      deltaScale,
      minScale,
      maxScale
    })

    const originX = x - left
    const originY = y - top

    const newOriginX = originX / scale
    const newOriginY = originY / scale

    const translate = Renderer.getTranslate({ scale, minScale, maxScale })

    const translateX = translate({
      translate: this.state.transformation.translateX,
      prevPos: this.state.transformation.originX,
      pos: originX
    })

    const translateY = translate({
      translate: this.state.transformation.translateY,
      prevPos: this.state.transformation.originY,
      pos: originY
    })

    this.state.element.style.transformOrigin = `${newOriginX}px ${newOriginY}px`
    this.state.element.style.transform = Renderer.getMatrix({
      scale: newScale,
      translateX,
      translateY
    })

    this.state.transformation = {
      originX: newOriginX,
      originY: newOriginY,
      scale: newScale,
      translateX,
      translateY
    }
  }

  pan({ originX, originY })
  {
    this.state.transformation.translateX += originX
    this.state.transformation.translateY += originY

    this.state.element.style.transform = Renderer.getMatrix({
      translateX: this.state.transformation.translateX,
      translateY: this.state.transformation.translateY,
      scale: this.state.transformation.scale
    })
  }

  panTo({ originX, originY, scale })
  {
    this.state.transformation.scale = scale

    this.pan({
      originX: originX - this.state.transformation.translateX,
      originY: originY - this.state.transformation.translateY
    })
  }

  panBy({ originX, originY })
  {
    this.pan({ originX, originY })
  }
}

function whichBtn(e, which = 1)
{
  if (!e.which && e.button) {
    switch (true) {
      case !!(e.button & 1):  // left
        e.which = 1
        break
      case !!(e.button & 2):  // right
        e.which = 3
        break
      case !!(e.button & 4):  // midd
        e.which = 2
        break
    }
  }

  return e.which === which
}

const lightbox = Vue.component('lightbox', {
  template: '#lightbox-template',

  components: {
    keybind
  },
  data: () => ({
    isFullscreen: false,
    renderer: null,

    multiple: [
      { /* ArrowLeft  */ keyCode: 37, preventDefault: true },
      { /* ArrowRight */ keyCode: 39, preventDefault: true }
    ],

    clickedIndex: 0,
    newIndex: 0,
    gallery: [],

    down: false
  }),
  computed: {
    nextBtnHide()
    {
      return this.newIndex >= this.gallery.length - 1
    },
    prevBtnHide()
    {
      return this.newIndex === 0
    }
  },
  methods: {
    async toggle()
    {
      await this.$fullscreen.toggle(this.$refs.previewBox)

      this.isFullscreen = this.$fullscreen.isFullscreen
    },
    panTo()
    {
      this.renderer.panTo({ originX: 0, originY: 0, scale: 1 })
    },
    panBy(e)
    {
      e.preventDefault()

      this.renderer.panBy({
        originX: e.movementX,
        originY: e.movementY
      })
    },
    panStart(e)
    {
      if (this.down || !whichBtn(e)) return

      this.$refs.overlay.addEventListener('mousemove', this.panBy, false)

      this.down = true
    },
    panStop()
    {
      this.$refs.overlay.removeEventListener('mousemove', this.panBy, false)

      this.down = false
    },
    wheel(e)
    {
      e.preventDefault()

      this.renderer.zoom({
        deltaScale: Math.sign(e.deltaY),
        x: e.clientX,
        y: e.clientY
      })
    },
    open(idx, list)
    {
      document.body.style.overflow = 'hidden'

      this.panTo()
      this.clickedIndex = this.newIndex = idx
      this.gallery = list
    },
    async close()
    {
      document.body.style.overflow = 'auto'

      this.newIndex = this.clickedIndex
      this.gallery = []

      if (this.$fullscreen.isFullscreen) {
        await this.toggle()
      }
    },
    nextBtnClick()
    {
      if (this.nextBtnHide) return

      this.panTo()

      this.newIndex++
    },
    prevBtnClick()
    {
      if (this.prevBtnHide) return

      this.panTo()

      this.newIndex--
    },
    handler({ event })
    {
      switch (event.key) {
        case 'ArrowRight':
          this.nextBtnClick()
          break
        case 'ArrowLeft':
          this.prevBtnClick()
          break
      }
    }
  },
  async mounted()
  {
    await this.$nextTick()

    this.$bus.$on('open', ({ currentIdx, list }) => {
      this.open(currentIdx, list)
    })

    this.renderer = Renderer.init({
      element: this.$refs.previewImg,
      scaleSensitivity: 50,
      minScale: .1,
      maxScale: 30
    })
  }
})

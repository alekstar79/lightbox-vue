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
  props: {
    eventbus: {
      type: Boolean,
      default: false
    },
    openData: {
      type: Object,
      default: () => ({})
    }
  },
  model: {
    prop: 'openData',
    event: 'change'
  },
  data: () => ({
    isFullscreen: false,
    renderer: null,

    multiple: [
      { /* ArrowRight */ keyCode: 39, preventDefault: true },
      { /* ArrowLeft  */ keyCode: 37, preventDefault: true },
      { /* Escape     */ keyCode: 27, preventDefault: true }
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
  watch: {
    openData: 'open'
  },
  methods: {
    async toggle()
    {
      this.isFullscreen = await this.$fullscreen.toggle(this.$refs.previewBox)
    },
    panTo()
    {
      this.$renderer.panTo({ originX: 0, originY: 0, scale: 1 })
    },
    panBy(e)
    {
      e.preventDefault()

      this.$renderer.panBy({
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

      this.$renderer.zoom({
        deltaScale: Math.sign(e.deltaY),
        x: e.clientX,
        y: e.clientY
      })
    },
    open({ idx, list })
    {
      if (typeof idx === 'undefined') return

      document.body.style.overflow = 'hidden'

      this.panTo()
      this.clickedIndex = this.newIndex = idx
      this.gallery = list
    },
    async close()
    {
      document.body.style.overflow = 'auto'

      this.$emit('change', {})
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
        case 'Escape':
          this.isFullscreen = this.$fullscreen.isFullscreen
          break
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

    if (this.eventbus) {
      this.$bus.$on('lightbox:open', this.open)
    }

    this.$renderer.init({
      element: this.$refs.previewImg
    })
  }
})

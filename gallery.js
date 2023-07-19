const fn = (_, i) => ({ src: `images/img-${`${i + 1}`.padStart(2, '0')}.jpg`})
const expose = 'lightbox:open'

const gallery = Vue.component('gallery', {
  template: '#gallery-template',

  props: {
    eventbus: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    theme: 'light',
    list: 'img',
    source: []
  }),
  computed: {
    togglerState: {
      set(list) {
        this.list = list ? 'img' : 'lnk'
      },
      get() {
        return this.list === 'img'
      }
    },
    light: {
      set(theme) {
        this.theme = theme ? 'light' : 'dark'
      },
      get() {
        return this.theme === 'light'
      }
    }
  },
  methods: {
    buildList()
    {
      return Array.from({ length: 28 }, fn)
        .map(a => ({ value: a, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(a => a.value)
    },
    onClickGallery({ target })
    {
      if (!['A','IMG'].includes(target.tagName)) return

      const link = target.src || target.textContent,
        data = {}

      data.list = [...this.source]
        .map(({ src }, idx) => {
          if (link.includes(src)) {
            data.idx = idx
          }

          return src
        })

      this.eventbus
        ? this.$bus.$emit(expose, data)
        : this.$emit(expose, data)
    },
    toggleTheme()
    {
      document.documentElement.classList.toggle('dark-theme')

      this.light = !this.light
    },
    reload()
    {
      this.source = this.buildList()
    }
  },
  created()
  {
    this.reload()
  }
})

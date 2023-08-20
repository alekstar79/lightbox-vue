let list = fetch('/api/index.json'),
  fn = (_, i) => ({ idx: `${i + 1}`.padStart(2, '0'), src: `img-${`${i + 1}`.padStart(2, '0')}.jpg`}),
  source = Array.from({ length: 28 }, fn),
  expose = 'lightbox:open'

function shuffle(source)
{
  return source.map(a => ({ value: a, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(a => a.value)
}

const gallery = Vue.component('gallery', {
  template: '#gallery-template',

  directives: {
    lazy: {
      inserted(el, { value: { src, loaded, w = 1, h = 1 } }, { context }) {
        el.parentElement.style.aspectRatio = src && !loaded ? w / h : ''

        if (loaded) {
          return el.src = `images/${src}`
        }

        let img = new Image()

        img.addEventListener('load', function handler() {
          img.removeEventListener('load', handler)

          context.shuffled.find(s => s.src === src).loaded = true

          el.parentElement.classList.add('loaded')
          el.parentElement.style.aspectRatio = ''
          el.src = img.src

          img = null
        })

        setTimeout(() => {
          img.src = `images/${src}`
        }, 9)
      }
    }
  },
  props: {
    eventbus: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    shuffled: shuffle(source),
    update: false,

    theme: 'light',
    list: 'img'
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
  watch: {
    shuffled() {
      this.update = !this.update
    }
  },
  methods: {
    onClickGallery({ target })
    {
      if (!['A','IMG'].includes(target.tagName)) return

      const link = target.src || target.textContent,
        data = {}

      data.list = [...this.shuffled]
        .map(({ src }, idx) => {
          if (link.includes(src)) {
            data.idx = idx
          }

          return src
        })

      this.emit(data)
    },
    emit(data)
    {
      this.eventbus ? this.$bus.$emit(expose, data) : this.$emit(expose, data)
    },
    toggleTheme()
    {
      document.documentElement.classList.toggle('dark-theme')

      this.light = !this.light
    },
    reload()
    {
      this.shuffled = shuffle(this.shuffled)
    }
  },
  async created()
  {
    try {

      list = await list

      if (list.status === 200) {
        this.shuffled = shuffle(await list.json())
      }

    } catch (e) {
    }
  }
})

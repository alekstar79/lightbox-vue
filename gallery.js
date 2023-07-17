const fn = (_, i) => ({ src: `images/img-${`${i + 1}`.padStart(2, '0')}.jpg`})

const gallery = Vue.component('gallery', {
  template: '#gallery-template',

  data: () => ({
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
            data.currentIdx = idx
          }

          return src
        })

      this.$bus.$emit('open', data)
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
